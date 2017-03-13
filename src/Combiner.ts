import {DependentState} from "./DependentState";
import {Observable} from "rxjs";

export class CombinerState<T extends any[]> extends DependentState<T> {

    constructor(source$: Observable<T>) {
        super(source$);
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


export function combine<T1, T2>(state1: DependentState<T1>,
                                state2: DependentState<T2>): CombinerState<[T1, T2]>;

export function combine<T1, T2, T3>(state1: DependentState<T1>,
                                    state2: DependentState<T2>,
                                    state3: DependentState<T3>): CombinerState<[T1, T2, T3]>;

export function combine<T1, T2, T3, T4>(state1: DependentState<T1>,
                                        state2: DependentState<T2>,
                                        state3: DependentState<T3>,
                                        state4: DependentState<T4>): CombinerState<[T1, T2, T3, T4]>;

export function combine<T1, T2, T3, T4, T5>(state1: DependentState<T1>,
                                            state2: DependentState<T2>,
                                            state3: DependentState<T3>,
                                            state4: DependentState<T4>,
                                            state5: DependentState<T5>): CombinerState<[T1, T2, T3, T4, T5]>;

export function combine<T1, T2, T3, T4, T5, T6>(state1: DependentState<T1>,
                                                state2: DependentState<T2>,
                                                state3: DependentState<T3>,
                                                state4: DependentState<T4>,
                                                state5: DependentState<T5>,
                                                state6: DependentState<T6>): CombinerState<[T1, T2, T3, T4, T5, T6]>;

export function combine(...states: DependentState<any>[]): CombinerState<any> {
    return new CombinerState<any>(Observable.combineLatest(
            states.map(o => o.observeAll()),
            (...args: any[]) => args
    ));
}

