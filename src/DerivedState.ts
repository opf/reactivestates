import {merge, Observable} from "rxjs";
import {filter, map} from "rxjs/operators";
import {AfterConnectFn, AfterDisConnectFn, IsNonValueFn, State} from "./State";

export class DerivedState<IT, IX, OT, OX> extends State<OT, OX> {

    private readonly inputState: State<IT, IX>;

    private readonly defaultWhenInputHasNonValue?: OT | OX;

    constructor(inputState: State<IT, IX>,
                stream: Observable<OT | OX>,
                isNonValue: IsNonValueFn<OT, OX>,
                defaultNonValue: OX,
                defaultWhenInputHasNonValue: OT | OX) {

        const afterConnect: AfterConnectFn<OT, OX> = (state, setStateFn) => {
            if (!state.hasValue()) {
                setStateFn(defaultWhenInputHasNonValue);
            }
        };
        const afterDisConnect: AfterDisConnectFn<OT, OX> = (state, setStateFn) => {
            setStateFn(defaultNonValue);
        };

        super(stream, isNonValue, afterConnect, afterDisConnect);
        this.inputState = inputState;
        this.defaultWhenInputHasNonValue = defaultWhenInputHasNonValue;
    }

    // public connect(): this {
    //     if (this.getObserverCount() === 0) {
    //         return this;
    //     }
    //
    //     super.connect();
    //     return this;
    // }

    // public lazy(): this {
    //     this.changes$("eager mode").subscribe();
    //     return this;
    // }

    // protected onObserverSubscribed() {
    //     if (this.getObserverCount() === 1) {
    //         this.connect();
    //     }
    // }
    //
    // protected onObserverUnsubscribed() {
    //     if (this.getObserverCount() === 0) {
    //         this.disconnect();
    //     }
    // }
}


export function deriveRaw<IT, IX, OT>(state: State<IT, IX>,
                                      transformer: ($: Observable<IT | IX>, inputState: State<IT, IX>) => Observable<OT | undefined>): DerivedState<IT, IX, OT, undefined> {

    const transformed: Observable<OT | undefined> = transformer(state.outputStreamTrailing, state);
    const isNonValue = (val: OT | undefined): val is undefined => {
        return val === undefined;
    };

    return new DerivedState<IT, IX, OT, undefined>(state, transformed, isNonValue, undefined, undefined);
}

export function derive<IT, OT, IX = undefined>(state: State<IT, IX>,
                                               transformer: ($: Observable<IT>, inputState: State<IT, IX>) => Observable<OT | undefined>,
                                               defaultWhenInputHasNonValue?: OT): DerivedState<IT, IX, OT, undefined> {

    let valueStream$: Observable<IT> = state.outputStreamTrailing.pipe(
            filter(v => !state.isNonValue(v))) as Observable<IT>;

    const values$: Observable<OT> = transformer(valueStream$, state) as Observable<OT>;
    const nonValues$: Observable<undefined> = state.outputStreamTrailing.pipe(
            filter(v => state.isNonValue(v)),
            map(_ => undefined));

    const source$: Observable<OT | undefined> = merge(values$, nonValues$) as any;

    const isNonValue = (val: OT | undefined): val is undefined => {
        return val === undefined;
    };

    return new DerivedState<IT, IX, OT, undefined>(state, source$, isNonValue, undefined, defaultWhenInputHasNonValue);
}
