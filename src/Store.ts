import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {input, InputState} from "./InputState";
import {LogEvent, logStoreEvent} from "./StoreLog";

export type StateMembers<T> = { [P in keyof T]: InputState<T[P]>; };

export interface SelectEvent<T> {
    data: T;
    fields: (keyof T)[];
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

    private actionCompleted = new Subject<string[]>();

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

    protected action(name: string, fn: (data: T, bla: any) => void, options?: any) {
        const touchedFields: string[] = [];

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
                            touchedFields.push(key);
                            cloneBack[key] = val;
                        }
                    }
            );
        });

        fn(clone, 1);

        const logEvent = new LogEvent(name, []);

        // check for new fields
        const newFields = _.difference(_.keysIn(clone), _.keysIn(cloneBack));
        newFields.forEach(field => {
            this.states[field] = createInputState(field);
            let value = clone[field];
            cloneBack[field] = value;
            touchedFields.push(field);

            logEvent.changes.push(["added", field, value]);
        });

        this.currentData = cloneBack;

        // console.log("    new fields       :", JSON.stringify(newFields));
        // console.log("    clone            :", JSON.stringify(clone));
        // console.log("    cloneBack        :", JSON.stringify(cloneBack));
        // console.log("    touchedFields    :", JSON.stringify(touchedFields));
        // console.log("    currentData      :", JSON.stringify(this.currentData));

        // transfer field values to states
        touchedFields.forEach(f => {
            let value = clone[f];
            this.states[f].putValue(value);

            if (!_.includes(newFields, f)) {
                if (_.isNil(value)) {
                    logEvent.changes.push(["removed", f, value]);
                } else {
                    logEvent.changes.push(["changed", f, value]);
                }
            }
        });

        logStoreEvent(logEvent);
        this.actionCompleted.next(touchedFields);
    }

    get data(): T {
        return this.currentData;
    }

    select<K extends keyof T>(...fields: K[]): Observable<SelectEvent<T>> {
        let futureChanges = this.actionCompleted
                .filter(touchedFields => {
                    return _.intersection(touchedFields, fields).length > 0;
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
            futureChanges = futureChanges.startWith(fields);
        }

        return futureChanges
                .map(fields => {
                    return {
                        data: this.data,
                        fields: fields
                    };
                });
    }

    selectAll<K extends keyof T>(): Observable<SelectEvent<T>> {
        const data: T = this.data;
        const keys: string[] = _.keysIn(data);
        const keysWithValues: string[] = keys.filter(key => _.get(data, key) !== undefined);
        return this.actionCompleted
                .startWith(keysWithValues)
                .map(fields => {
                    return {
                        data: this.data,
                        fields: fields
                    };
                });
    }

}

// export class Data {
//     field1: number|undefined ;
//     field3: number[];
// }
//
// export class MyStore extends Store<Data> {
//
//     constructor() {
//         super(new Data());
//     }
//
//     action1() {
//         this.action(data => {
//             data.field1 = undefined;
//             data.field3 = [1, 2, 3];
//         }, {
//             deepClone: true
//         });
//     }
//
//
// }


