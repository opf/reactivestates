import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {input, InputState} from "./InputState";
import {enableReactiveStatesLogging} from "./log";
import {wrapObservableWithMemoryLeakDetection} from "./ObservableWithMemoryLeakDetection";
import {LogEvent, logInvalidDataChange, logStoreEvent} from "./StoreLog";

declare const Proxy: any;

let developmentMode = false;

let memoryLeakDetection = false;

let invalidDataModificationComparator: <T>(v1: T, v2: T) => boolean
        = (v1: any, v2: any) => _.isEqual(v1, v2);

export type StateMembers<T> = { [P in keyof T]: InputState<T[P]>; };

export interface ActionOptions<T> {
    deepCloneFields?: (keyof T)[];
    afterAction?: (store: Store<T>, data: T, modifiedFields: Set<string>, newFields: Set<string>) => void;
    log?: boolean;
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

export function enableMemoryLeakDetection(enable: boolean = true) {
    memoryLeakDetection = true;
}

function createInputState(name: string) {
    const is = input<any>();
    is.name = name;
    is.logEnabled = false;
    return is;
}

function createDefensiveProxy<T>(source: T): { proxy: T, accessedMembers: any } {
    const accessedMembers: any = {};
    const accessedMembersCopy: any = {};
    const proxyHandler = {
        get: function (target: any, key: string) {
            let cloned = _.cloneDeep(target[key]);
            if (_.has(accessedMembers, key)) {
                let version1 = accessedMembers[key];
                let version2 = accessedMembersCopy[key];
                if (!invalidDataModificationComparator(version1, version2)) {
                    throw logInvalidDataChange(key, version1, version2);
                }
            }
            accessedMembers[key] = cloned;
            accessedMembersCopy[key] = _.cloneDeep(cloned);
            return cloned;
        },
        set: function (target: any, key: string, version2: string) {
            let version1 = accessedMembers[key];
            throw logInvalidDataChange(key, version1, version2);
        }
    };
    return {
        proxy: new Proxy(source, proxyHandler),
        accessedMembers
    };
}


export abstract class Store<T> {

    readonly states: StateMembers<T>;

    private dataState: T;

    private lastCreatedDefensiveProxy: { proxy: T, accessedMembers: any } | null = null;

    private isInsideAction = false;

    // private actionDataState: T;

    // private actionsStack: string[] = [];

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
    // private dataAfterLastAction: T | null = null;
    // private nameOfLastAction: string | null = null;
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

    get data(): Readonly<T> {
        if (developmentMode && this.lastCreatedDefensiveProxy !== null) {
            const proxy = this.lastCreatedDefensiveProxy;
            _.keys(proxy.accessedMembers).forEach(k => _.get(proxy.proxy, k));
        }

        const defensiveProxy = createDefensiveProxy(this.dataState);
        this.lastCreatedDefensiveProxy = defensiveProxy;
        return defensiveProxy.proxy;
        // return this.dataState;
    }

    select<K extends keyof T>(...fields: K[]): Observable<SelectEvent<T>> {
        const selected = this.actionCompletedBuffered
                .filter(changedFields => {
                    return fields.length === 0 || _.some(fields, f => changedFields.has(f));
                })
                .startWith(new Set(fields))
                .map(fields => new SelectEvent(this.data, new Set(fields)));

        if (memoryLeakDetection) {
            return wrapObservableWithMemoryLeakDetection(selected);
        } else {
            return selected;
        }
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

    // private checkForInvalidStateChangeBetweenActions(currentActionName: string) {
    //     if (developmentMode && this.dataAfterLastAction !== null) {
    //
    //         const invalidDataChange =
    //                 !invalidDataModificationComparator(this.dataState, this.dataAfterLastAction);
    //
    //         if (invalidDataChange) {
    //             this.dataAfterLastAction = this.dataState; // avoid repeating error messages
    //             throw logInvalidStateChangeOutsideAction(
    //                     this.nameOfLastAction!, currentActionName, this.dataAfterLastAction, this.dataState);
    //         }
    //     }
    // }

    protected action<R>(actionName: string, fn: (data: T, bla: any) => R, actionOptions?: ActionOptions<T>): R {
        // this.checkForInvalidStateChangeBetweenActions(actionName);

        const options = _.merge(this.defaultActionOptions(), actionOptions);

        let outerData: any = this.dataState;
        let isRootAction = !this.isInsideAction;
        this.isInsideAction = true;
        // if (this.actionsStack.length === 0) {
        //     isRootAction = true;
        //     outerData = this.dataState;
        // }

        // in devMode: remember state to check if the action deeply change anything (1/2)
        let outerDataWasModified = false;
        let outerDataCopy: any;
        if (developmentMode) {
            outerDataCopy = _.cloneDeep(outerData);
        }

        // shallow/deep clone for action
        const innerData: any = _.clone(outerData);
        let deepClonedFields = new Set<string>();
        if (options.deepCloneFields) {
            options.deepCloneFields.forEach(fieldName => {
                if (_.has(outerData, fieldName)) {
                    innerData[fieldName] = _.cloneDeep(outerData[fieldName]);
                    deepClonedFields.add(fieldName);
                } else {
                    throw new Error(`Can't deepCloneField '${fieldName}'. Field does not exist.`);
                }
            });
        }

        // set defensive proxy to shield from modifications done via this.data
        // const defensiveProxy = createDefensiveProxy(actionName, innerData);
        // this.dataState = defensiveProxy.proxy;
        // this.actionDataState = innerData;
        this.dataState = innerData;

        let result: R;
        // this.actionsStack.push(actionName);
        try {
            result = fn.apply(this, [innerData]);
        }
        finally {
            // this.actionsStack.pop();
            this.dataState = outerData;
            // this.actionDataState = outerData;
        }

        // in devMode: check if fields were added to the defensiveProxy
        if (developmentMode) {
            // re-get all accessed members to trigger change detection
            // _.keys(defensiveProxy.accessedMembers).forEach(k => _.get(defensiveProxy.proxy, k));
        }

        // in devMode: remember state to check if the action deeply change anything (2/2)
        if (developmentMode) {
            outerDataWasModified = !_.isEqual(outerData, outerDataCopy);
            if (outerDataWasModified) {
                throw new Error(`action '${actionName}' mutated data`);
            }
        }

        const newFields = new Set<string>();
        const changedFields = new Set<string>();
        const newAndChangedFields = new Set<string>();

        // Logging
        let stack = new Error().stack;
        const logEvent = new LogEvent(actionName, [], stack);

        // Check changes
        _.keysIn(innerData).forEach(fieldName => {
            const value = innerData[fieldName];
            if (_.hasIn(outerData, fieldName)) {
                const valueInOrigin = outerData[fieldName];

                const eq = deepClonedFields.has(fieldName) ? _.isEqual : _.eq;
                if (!eq(value, valueInOrigin)) {
                    // field changed
                    this.stateField(fieldName as any).putValue(value);

                    outerData[fieldName] = value;
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
                outerData[fieldName] = value;
                newFields.add(fieldName);
                newAndChangedFields.add(fieldName);
                this.stateField(fieldName as any).putValue(value);
                logEvent.changes.push(["added", fieldName, value]);
            }
        });

        if (options.log !== false) {
            logStoreEvent(logEvent);
        }

        this.actionCompleted.next(newAndChangedFields as any);

        if (options.afterAction) {
            options.afterAction(this, innerData, changedFields, newFields);
        }

        if (developmentMode) {
            this.data; // access getter to trigger modification check
        //     this.dataAfterLastAction = _.cloneDeep(this.dataState);
        //     this.nameOfLastAction = actionName;
        }

        if (isRootAction) {
        //     this.actionDataState = this.dataState;
            this.isInsideAction = false;
            this.actionStackCompletedTrigger.next();
        }

        return result;
    }
}
