import {Observable} from "rxjs";
import {State} from "./State";

export class CombinerState<T extends Array<any>, X extends Array<any>> extends State<T, X> {

    constructor(states: State<any, any>[]) {
        // input
        const input: Observable<T|X> = Observable.combineLatest(
                states.map(o => o.changes$()),
                (...args: any[]) => args) as Observable<T|X>;

        // isNonValue
        const isNonValue = (x: T|X): x is X => {
            if (x === undefined) {
                return true;
            }

            if (x.length === 0) {
                return true;
            }

            for (let v of x) {
                if (v === undefined) {
                    return true;
                }
            }
            return false;
        };

        const afterConnect = () => {};
        const afterDisConnect = () => {};

        super(input, isNonValue, afterConnect, afterDisConnect);
    }

}


export function combine<T1, T1X, T2, T2X>(state1: State<T1, T1X>,
                                          state2: State<T2, T2X>): CombinerState<[T1, T2], [T1X, T2X]>;

export function combine<T1, T1X, T2, T2X, T3, T3X>(state1: State<T1, T1X>,
                                                   state2: State<T2, T2X>,
                                                   state3: State<T3, T3X>): CombinerState<[T1, T2, T3], [T1X, T2X, T3X]>;

export function combine<T1, T1X, T2, T2X, T3, T3X, T4, T4X>(state1: State<T1, T1X>,
                                                            state2: State<T2, T2X>,
                                                            state3: State<T3, T3X>,
                                                            state4: State<T4, T4X>): CombinerState<[T1, T2, T3, T4], [T1X, T2X, T3X, T4X]>;

export function combine<T1, T1X, T2, T2X, T3, T3X, T4, T4X, T5, T5X>(state1: State<T1, T1X>,
                                                                     state2: State<T2, T2X>,
                                                                     state3: State<T3, T3X>,
                                                                     state4: State<T4, T4X>,
                                                                     state5: State<T5, T5X>): CombinerState<[T1, T2, T3, T4, T5], [T1X, T2X, T3X, T4X, T5X]>;

export function combine<T1, T1X, T2, T2X, T3, T3X, T4, T4X, T5, T5X, T6, T6X>(state1: State<T1, T1X>,
                                                                              state2: State<T2, T2X>,
                                                                              state3: State<T3, T3X>,
                                                                              state4: State<T4, T4X>,
                                                                              state5: State<T5, T5X>,
                                                                              state6: State<T6, T6X>): CombinerState<[T1, T2, T3, T4, T5, T6], [T1X, T2X, T3X, T4X, T5X, T6X]>;

export function combine(...states: State<any, any>[]): CombinerState<any, any> {
    return new CombinerState(states);
}
