import {Observable} from "rxjs";
import {State} from "./State";

export class DerivedState<IT, IX, OT, OX> extends State<OT, OX> {

    private readonly inputState: State<IT, IX>;

    private readonly defaultWhenInputHasNonValue?: OT | OX;

    constructor(inputState: State<IT, IX>, stream: Observable<OT | OX>, defaultWhenInputHasNonValue?: OT | OX) {
        super(stream, defaultWhenInputHasNonValue);
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

    protected isSetValueAfterConnect(): boolean {
        return !this.inputState.hasValue() && this.defaultWhenInputHasNonValue !== undefined;
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
                                transformer: ($: Observable<IT | IX>, inputState: State<IT, IX>) => Observable<OT | OX>): DerivedState<IT, IX, OT, OX> {

    const transformed: Observable<OT | OX> = transformer(state.changes$(), state);
    return new DerivedState<IT, IX, OT, OX>(state, transformed);
}

// export function derive<I, T>(state: State<I>,
//                              transformer: ($: Observable<I>, inputState: State<I>) => Observable<T>,
//                              defaultWhenInputHasNonValue?: T): DerivedState<I, T> {
//
//     const values$: Observable<T> = transformer(state.values$(), state);
//     const nonValues$: Observable<undefined> = state.nonValues$();
//     const source$: Observable<T | undefined> = Observable.merge(nonValues$, values$);
//
//     return new DerivedState(state, source$, defaultWhenInputHasNonValue);
// }
