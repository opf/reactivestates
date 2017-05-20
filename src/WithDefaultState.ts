import {Observable} from "rxjs/Observable";
import {State} from "./State";

export class WithDefaultState<T1, T2> extends State<T1 | T2> {

    constructor(input: State<T1>, defaultValue: T2) {
        if (input.hasValue()) {
            super(input.changes$());
        } else {
            const default$ = Observable.of(defaultValue);
            let merged: Observable<T1 | T2> = Observable.merge(input.changes$(), default$);
            super(merged);
        }
    }

}

export function withDefault<T1, T2>(input: State<T1>, defaultValue: T2): WithDefaultState<T1, T2> {
    return new WithDefaultState(input, defaultValue);
}

