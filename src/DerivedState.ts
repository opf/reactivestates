import {Observable} from "rxjs";
import {AfterConnectFn, AfterDisConnectFn, IsNonValueFn, State} from "./State";

export class DerivedState<IT, IX, OT, OX> extends State<OT, OX> {

    private readonly inputState: State<IT, IX>;

    private readonly defaultWhenInputHasNonValue?: OT | OX;

    constructor(inputState: State<IT, IX>,
                stream: Observable<OT | OX>,
                isNonValue: IsNonValueFn<OT, OX>,
                defaultWhenInputHasNonValue?: OT | OX) {

        const afterConnect: AfterConnectFn<OT, OX> = (state, setStateFn) => {
            if (!state.hasValue() && defaultWhenInputHasNonValue !== undefined) {
                setStateFn(defaultWhenInputHasNonValue);
            }
        };
        const afterDisConnect: AfterDisConnectFn<OT, OX> = (state, setStateFn) => {
            setStateFn(defaultWhenInputHasNonValue!);
        };

        super(stream, isNonValue, afterConnect, afterDisConnect);
        this.inputState = inputState;
        this.defaultWhenInputHasNonValue = defaultWhenInputHasNonValue;
    }

    public connect(): this {
        if (this.getObserverCount() === 0) {
            return this;
        }

        super.connect();
        return this;
    }

    protected onObserverSubscribed() {
        if (this.getObserverCount() === 1) {
            this.connect();
        }
    }

    protected onObserverUnsubscribed() {
        if (this.getObserverCount() === 0) {
            this.disconnect();
        }
    }
}


export function deriveRaw<IT, IX, OT, OX>(state: State<IT, IX>,
                                          transformer: ($: Observable<IT | IX>, inputState: State<IT, IX>) => Observable<OT | OX>,
                                          isNonValue: IsNonValueFn<OT, OX>): DerivedState<IT, IX, OT, OX> {

    const transformed: Observable<OT | OX> = transformer(state.changes$(), state);
    return new DerivedState<IT, IX, OT, OX>(state, transformed, isNonValue);
}

export function derive<IT, IX, OT, OX>(state: State<IT, IX>,
                                       transformer: ($: Observable<IT | IX>, inputState: State<IT, IX>) => Observable<OT | OX>,
                                       isNonValue: IsNonValueFn<OT, OX>,
                                       defaultWhenInputHasNonValue?: OT): DerivedState<IT, IX, OT, OX> {

    const values$: Observable<T> = transformer(state.values$(), state);
    const nonValues$: Observable<undefined> = state.nonValues$();
    const source$: Observable<T | undefined> = Observable.merge(nonValues$, values$);

    return new DerivedState(state, source$, defaultWhenInputHasNonValue);
}
