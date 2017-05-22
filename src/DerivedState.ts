import {Observable} from "rxjs";
import {State} from "./State";

export class DerivedState<I, T> extends State<T> {

    private readonly inputState: State<I>;

    private readonly defaultWhenInputHasNonValue: T | undefined;

    constructor(inputState: State<I>, stream: Observable<T | undefined>, defaultWhenInputHasNonValue?: T) {
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


export function deriveRaw<I, T>(state: State<I>,
                                transformer: ($: Observable<I | undefined>, inputState: State<I>) => Observable<T | undefined>): DerivedState<I, T> {

    const transformed: Observable<T | undefined> = transformer(state.changes$(), state);
    return new DerivedState(state, transformed);
}

export function derive<I, T>(state: State<I>,
                             transformer: ($: Observable<I>, inputState: State<I>) => Observable<T>,
                             defaultWhenInputHasNonValue?: T): DerivedState<I, T> {

    const values$: Observable<T> = transformer(state.values$(), state);
    const nonValues$: Observable<undefined> = state.nonValues$();
    const source$: Observable<T | undefined> = Observable.merge(nonValues$, values$);

    return new DerivedState(state, source$, defaultWhenInputHasNonValue);
}
