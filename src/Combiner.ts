import {Observable} from "rxjs";
import {State} from "./State";

export class CombinerState<T extends any[]> extends State<T> {

    constructor(source$: Observable<T>, initialArray: T) {
        super(source$, initialArray);
    }

    isNonValue(vals: T): boolean {
        if (super.isNonValue(vals)) {
            return true;
        }
        for (let v of vals) {
            if (v === undefined) {
                return true;
            }
        }
        return false;
    }
}


export function combine<T1, T2>(state1: State<T1>,
                                state2: State<T2>): CombinerState<[T1, T2]>;

export function combine<T1, T2, T3>(state1: State<T1>,
                                    state2: State<T2>,
                                    state3: State<T3>): CombinerState<[T1, T2, T3]>;

export function combine<T1, T2, T3, T4>(state1: State<T1>,
                                        state2: State<T2>,
                                        state3: State<T3>,
                                        state4: State<T4>): CombinerState<[T1, T2, T3, T4]>;

export function combine<T1, T2, T3, T4, T5>(state1: State<T1>,
                                            state2: State<T2>,
                                            state3: State<T3>,
                                            state4: State<T4>,
                                            state5: State<T5>): CombinerState<[T1, T2, T3, T4, T5]>;

export function combine<T1, T2, T3, T4, T5, T6>(state1: State<T1>,
                                                state2: State<T2>,
                                                state3: State<T3>,
                                                state4: State<T4>,
                                                state5: State<T5>,
                                                state6: State<T6>): CombinerState<[T1, T2, T3, T4, T5, T6]>;

export function combine(...states: State<any>[]): CombinerState<any> {
    // strange workaround since Array(n) doesn't seem to generate exactly the same
    const initialArray = [];
    for (let i = 0; i < states.length; i++) {
        initialArray.push(undefined);
    }

    return new CombinerState<any>(Observable
            .combineLatest(
                    states.map(o => o.changes$()),
                    (...args: any[]) => args
            ), initialArray);
}

