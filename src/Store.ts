import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {input, InputState} from "./InputState";
import {enableReactiveStatesLogging} from "./log";
import {
    LogEvent, logInvalidDataChangeInsideAction, logInvalidStateChangeOutsideAction,
    logStoreEvent
} from "./StoreLog";

let developmentMode = false;

let invalidDataModificationComparator: <T>(v1: T, v2: T) => boolean
        = (v1: any, v2: any) => _.isEqual(v1, v2);

export type StateMembers<T> = { [P in keyof T]: InputState<T[P]>; };

export interface ActionOptions<T> {
    deepCloneFields?: (keyof T)[];
    afterAction?: (store: Store<T>, data: T, modifiedFields: Set<string>, newFields: Set<string>) => void;
}

export class SelectEvent<T> {

    constructor(public readonly data: T,
                public readonly fields: Set<keyof T>) {
    }

    allSelectedFieldsNonNil(): boolean {
        return _.every(Array.from(this.fields), f => !_.isNil((this.data as any)[f]));
    }

}

export function setInvalidDataModificationComparator<T>(fn: (v1: T, v2: T) => boolean) {
    invalidDataModificationComparator = fn;
}

export function enableDevelopmentMode(enable: boolean = true) {
    developmentMode = enable;
    enableReactiveStatesLogging(enable);
}

function createInputState(name: string) {
    const is = input<any>();
    is.name = name;
    is.logEnabled = false;
    return is;
}


export abstract class Store<T> {

    readonly states: StateMembers<T>;

    private dataState: T;

    private actionDataState: T | null = null;

    private actionNameStack: string[] = [];

    private actionCompleted = new Subject<Set<keyof T>>();

    private actionStackCompletedTrigger = new Subject<any>();

    private actionCompletedBuffered: Observable<Set<keyof T>> = this.actionCompleted
            .bufferWhen(() => this.actionStackCompletedTrigger)
            .map(sets => {
                const all = new Set<any>();
                sets.forEach(s => s.forEach(k => all.add(k)));
                return all;
            })
    ;

    // for debugging in dev mode --------------------------------
    private dataAfterLastAction: T | null = null;

    private nameOfLastAction: string | null = null;
    // ----------------------------------------------------------

    /**
     * @param data
     */
    constructor(data: T) {
        this.dataState = data;

        // init inputStates
        const states: any = {};
        _.forIn(this.dataState, (value: any, key: string) => {
            let inputState = createInputState(key);
            if (value !== undefined) {
                inputState.putValue(value);
            }
            states[key] = inputState;
        });
        this.states = states;
    }

    get data(): T {
        return this.dataState;
    }

    select<K extends keyof T>(...fields: K[]): Observable<SelectEvent<T>> {
        return this.actionCompletedBuffered
                .filter(changedFields => {
                    return _.some(fields, f => changedFields.has(f));
                })
                .startWith(new Set(fields))
                .map(fields => new SelectEvent(this.data, new Set(fields)));
    }

    selectNonNil<K extends keyof T>(...fields: K[]): Observable<SelectEvent<T>> {
        return this.select(...fields)
                .filter(s => s.allSelectedFieldsNonNil());
    }

    stateField<M extends keyof T>(name: M): InputState<T[M]> {
        if (!_.has(this.states, name)) {
            this.states[name] = input<any>();
        }
        return this.states[name];
    }

    protected defaultActionOptions(): ActionOptions<T> {
        return {};
    }

    private checkForInvalidStateChangeBetweenActions(currentActionName: string) {
        if (developmentMode) {
            const invalidDataChange = this.dataAfterLastAction !== null
                    && !invalidDataModificationComparator(this.dataState, this.dataAfterLastAction);
            if (invalidDataChange) {
                throw logInvalidStateChangeOutsideAction(
                        this.nameOfLastAction!, currentActionName, this.dataAfterLastAction, this.dataState);
            }
        }
    }

    protected action<R>(name: string, fn: (data: T, bla: any) => R, actionOptions?: ActionOptions<T>): R {
        this.checkForInvalidStateChangeBetweenActions(name);

        const options = _.merge(this.defaultActionOptions(), actionOptions);

        const outerActionData: any = this.actionDataState !== null ? this.actionDataState : this.dataState;

        // in devMode: remember state to check if the action deeply change anything (1/2)
        let outerDataCopy: any;
        let outerDataWasModified = false;
        if (developmentMode) {
            outerDataCopy = _.cloneDeep(outerActionData);
        }

        // shallow/deep clone for action
        const innerData: any = _.clone(outerActionData);
        let deepClonedFields = new Set<string>();
        if (options.deepCloneFields) {
            options.deepCloneFields.forEach(fieldName => {
                if (_.has(outerActionData, fieldName)) {
                    innerData[fieldName] = _.cloneDeep(outerActionData[fieldName]);
                    deepClonedFields.add(fieldName);
                } else {
                    throw new Error(`Can't deepCloneField '${fieldName}'. Field does not exist.`);
                }
            });
        }

        // set defensive proxy to shield from modifications done via this.data
        const defensiveProxy: any = {};
        Object.setPrototypeOf(defensiveProxy, innerData);
        this.dataState = defensiveProxy;

        this.actionDataState = innerData;

        this.actionNameStack.push(name);
        let result: R;
        try {
            result = fn.apply(this, [innerData]);
        }
        finally {
            this.dataState = outerActionData;
            this.actionDataState = outerActionData;
            this.actionNameStack.pop();
        }

        // in devMode: check if fields were added to the defensiveProxy
        if (developmentMode) {
            let addedMembersInProxy = _.keys(defensiveProxy);
            if (addedMembersInProxy.length > 0) {
                throw logInvalidDataChangeInsideAction(name);
            }
        }

        // in devMode: remember state to check if the action deeply change anything (2/2)
        if (developmentMode) {
            outerDataWasModified = !_.isEqual(outerActionData, outerDataCopy);
            if (outerDataWasModified) {
                throw new Error("action mutated data");
            }
        }

        const newFields = new Set<string>();
        const changedFields = new Set<string>();
        const newAndChangedFields = new Set<string>();

        // Logging
        let stack = new Error().stack;
        const logEvent = new LogEvent(name, [], stack);

        // Check changes
        _.keysIn(innerData).forEach(fieldName => {
            const value = innerData[fieldName];
            if (_.hasIn(outerActionData, fieldName)) {
                const valueInOrigin = outerActionData[fieldName];

                const eq = deepClonedFields.has(fieldName) ? _.isEqual : _.eq;
                if (!eq(value, valueInOrigin)) {
                    // field changed
                    this.stateField(fieldName as any).putValue(value);

                    outerActionData[fieldName] = value;
                    changedFields.add(fieldName);
                    newAndChangedFields.add(fieldName);

                    if (_.isNil(value)) {
                        logEvent.changes.push(["removed", fieldName, value]);
                    } else {
                        logEvent.changes.push(["changed", fieldName, value]);
                    }
                }
            } else {
                // field was added
                outerActionData[fieldName] = value;
                newFields.add(fieldName);
                newAndChangedFields.add(fieldName);
                this.stateField(fieldName as any).putValue(value);
                logEvent.changes.push(["added", fieldName, value]);
            }
        });

        logStoreEvent(logEvent);

        this.actionCompleted.next(newAndChangedFields as any);
        if (this.actionNameStack.length === 0) {
            this.actionStackCompletedTrigger.next();
        }

        if (options.afterAction) {
            options.afterAction(this, innerData, changedFields, newFields);
        }

        if (developmentMode) {
            this.dataAfterLastAction = _.cloneDeep(this.dataState);
            this.nameOfLastAction = name;
        }

        return result;
    }
}
