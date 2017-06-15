import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {input, InputState} from "./InputState";
import {LogEvent, logStoreEvent} from "./StoreLog";

export type StateMembers<T> = { [P in keyof T]: InputState<T[P]>; };

export interface ActionOptions<T> {
    deepClone?: boolean;
    afterAction?: (store: Store<T>, data: T, touchedFields: Set<string>, newFields: Set<string>) => void;
}

export interface SelectEvent<T> {
    data: T;
    fields: Set<keyof T>;
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

    private dataThreadLocal: T|null = null;

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

        // let functions = _.functions(Object.getPrototypeOf(this));
        // console.log("functions", functions);
    }

    protected action(name: string, fn: (data: T, bla: any) => void, options?: ActionOptions<T>) {
        options = options ? options : {};

        const origin: any = this.dataThreadLocal !== null ? this.dataThreadLocal : this.currentData;
        const clone: any = _.clone(origin);
        this.dataThreadLocal = clone;
        fn(clone, 1);
        this.dataThreadLocal = origin;
        this.currentData = clone;

        const newFields = new Set<string>();
        const changedFields = new Set<string>();
        const newAndChangedFields = new Set<string>();
        const logEvent = new LogEvent(name, []);

        // Check changes
        _.keysIn(clone).forEach(fieldName => {
            const value = clone[fieldName];
            if (_.hasIn(origin, fieldName)) {
                const valueInOrigin = origin[fieldName];
                if (!_.eq(value, valueInOrigin)) {
                    // field changed
                    this.states[fieldName].putValue(value);
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
            options.afterAction(this, clone, changedFields, newFields);
        }
    }

    get data(): T {
        return this.currentData;
    }

    select<K extends keyof T>(...fields: K[]): Observable<SelectEvent<T>> {
        let futureChanges = this.actionCompleted
                .filter(touchedFields => {
                    return _.some(fields, f => touchedFields.has(f));
                });

        let alreadyHasAllSelectedFields = _.every(fields, field => {
            let state = this.states[field];
            if (state === undefined) {
                return false;
            } else if (!state.hasValue()) {
                return false;
            }

            return true;
        });

        if (alreadyHasAllSelectedFields) {
            futureChanges = futureChanges.startWith(new Set(fields));
        }

        return futureChanges
                .map(fields => {
                    return {
                        data: this.data,
                        fields: new Set(fields)
                    };
                });
    }

    selectAll<K extends keyof T>(): Observable<SelectEvent<T>> {
        const data: T = this.data;
        const keys: string[] = _.keysIn(data);
        const keysWithValues: string[] = keys.filter(key => _.get(data, key) !== undefined);
        return this.actionCompleted
                .startWith(new Set(keysWithValues))
                .map(fields => {
                    return {
                        data: this.data,
                        fields: fields
                    };
                });
    }

}
