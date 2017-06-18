import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {input, InputState} from "./InputState";
import {enableReactiveStatesLogging} from "./log";
import {LogEvent, logStoreEvent} from "./StoreLog";

let developmentMode = false;

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

    private currentData: T;

    private transientDataInAction: T;

    private actionCompleted = new Subject<Set<keyof T>>();

    constructor(data: T) {
        this.currentData = data;

        const states: any = {};
        _.forIn(this.currentData, (value: any, key: string) => {
            let inputState = createInputState(key);
            if (value !== undefined) {
                inputState.putValue(value);
            }
            states[key] = inputState;
        });
        this.states = states;
    }

    protected defaultActionOptions(): ActionOptions<T> {
        return {};
    }

    protected action(name: string, fn: (data: T, bla: any) => void, actionOptions?: ActionOptions<T>) {
        const options = _.merge(this.defaultActionOptions(), actionOptions);

        const outerData: any = !_.isNil(this.transientDataInAction) ? this.transientDataInAction : this.data;

        // in devMode: remember state to check if the action deeply change anything
        let outerDataCopy: any;
        let outerDataWasModified = false;
        if (developmentMode) {
            outerDataCopy = _.cloneDeep(outerData);
        }

        const innerData: any = _.clone(outerData);
        let deepCloneFields = new Set<string>();
        if (options.deepCloneFields) {
            options.deepCloneFields.forEach(field => {
                if (_.has(outerData, field)) {
                    innerData[field] = _.cloneDeep(outerData[field]);
                    deepCloneFields.add(field);
                }
            });
        }

        this.transientDataInAction = innerData;
        try {
            fn.apply(this, [innerData]);
        } finally {
            this.transientDataInAction = outerData;
        }

        if (developmentMode) {
            outerDataWasModified = !_.isEqual(outerData, outerDataCopy);
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
            if (_.hasIn(outerData, fieldName)) {
                const valueInOrigin = outerData[fieldName];

                const eq = deepCloneFields.has(fieldName) ? _.isEqual : _.eq;
                if (!eq(value, valueInOrigin)) {
                    // field changed
                    this.states[fieldName].putValue(value);
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
                this.states[fieldName] = createInputState(fieldName);
                this.states[fieldName].putValue(value);
                logEvent.changes.push(["added", fieldName, value]);
            }
        });

        logStoreEvent(logEvent);
        this.actionCompleted.next(newAndChangedFields as any);

        if (options.afterAction) {
            options.afterAction(this, innerData, changedFields, newFields);
        }
    }

    get data(): T {
        return this.currentData;
    }

    select<K extends keyof T>(...fields: K[]): Observable<SelectEvent<T>> {
        return this.actionCompleted
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

}
