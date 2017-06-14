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

    protected action(name: string, fn: (data: T, bla: any) => void, options?: ActionOptions<T>) {
        options = options ? options : {};
        const touchedFields = new Set<string>();

        const clone: any = {};
        const cloneBack: any = _.clone(this.currentData);
        _.forIn(cloneBack, (value: any, key: string) => {
            Object.defineProperty(
                    clone,
                    key,
                    {
                        enumerable: true,
                        get: () => cloneBack[key],
                        set: (val: any) => {
                            touchedFields.add(key);
                            cloneBack[key] = val;
                        }
                    }
            );
        });

        fn(clone, 1);

        const logEvent = new LogEvent(name, []);

        // check for new fields
        const newFields = new Set<string>(_.difference(_.keysIn(clone), _.keysIn(cloneBack)));
        newFields.forEach(fieldName => {
            this.states[fieldName] = createInputState(fieldName);
            let value = clone[fieldName];
            cloneBack[fieldName] = value;
            touchedFields.add(fieldName);

            logEvent.changes.push(["added", fieldName, value]);
        });

        this.currentData = cloneBack;
        const allRelevantFields = new Set<string>();

        // transfer field values to states
        touchedFields.forEach(fieldName => {
            allRelevantFields.add(fieldName);
            let value = cloneBack[fieldName];
            this.states[fieldName].putValue(value);

            if (newFields.has(fieldName)) {
                // this touched field was new
                touchedFields.delete(fieldName);
            } else {
                // this touched field existed before
                if (_.isNil(value)) {
                    logEvent.changes.push(["removed", fieldName, value]);
                } else {
                    logEvent.changes.push(["changed", fieldName, value]);
                }
            }
        });

        logStoreEvent(logEvent);

        if (options.afterAction) {
            options.afterAction(this, cloneBack, touchedFields, newFields);
        }

        this.actionCompleted.next(allRelevantFields as any);
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
