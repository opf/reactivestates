import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {input, InputState} from "./InputState";

export type StateMembers<T> = { [P in keyof T]: InputState<T[P]>; };

export abstract class Store<T> {

    readonly states: StateMembers<T>;

    private currentData: T;

    private actionCompleted = new Subject<string[]>();

    constructor(data: T) {
        this.currentData = data;

        const states: any = {};
        _.forIn(this.currentData, (value: any, key: string) => {
            let inputState = input<any>();
            if (value !== undefined) {
                inputState.putValue(value);
            }
            inputState.name = key;
            states[key] = inputState;
        });
        this.states = states;
    }

    protected action(fn: (data: T, bla: any) => void, options?: any) {
        console.log(("[action]"));

        const cloneBack: any = _.clone(this.currentData);
        const clone: any = {};
        const touchedFields: string[] = [];

        _.forIn(this.currentData, (value: any, key: string) => {
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

        console.log(JSON.stringify(this.currentData));
        console.log(JSON.stringify(clone));

        this.currentData = clone;

        // transfer field values to states
        touchedFields.forEach(f => {
            this.states[f].putValue(clone[f]);
        });

        // check for new fields
        const newFields = _.difference(_.keysIn(clone), _.keysIn(cloneBack));
        newFields.forEach(field => {
            this.states[field] = input<any>(clone[field]);
        });

        this.actionCompleted.next(touchedFields);
    }

    get data(): T {
        return this.currentData;
    }

    select<K extends keyof T>(...fields: K[]): Observable<K[]> {
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

        return futureChanges;
    }

}


export class Data {
    field1: number;
    field2: string = "s0";
    field3 = [0, 1, 2];
}

export class MyStore extends Store<Data> {

    constructor() {
        super(new Data());
    }

    action1() {
        this.action(data => {
            data.field1 = 1;

            // data.field3.push(3);
            // data.field3 = data.field3;
            //
            data.field3 = [
                ...data.field3,
                3
            ];
        }, {
            deepClone: true
        });
    }


}


