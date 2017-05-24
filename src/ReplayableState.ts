import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {State} from "./State";

export class ReplayableState<T, X> extends State<T, X> {

    private readonly replay$: Subject<T | X>;

    constructor(input: State<T, X>) {
        const replay$ = new Subject<T>();
        const merged = Observable.merge(input.changes$(), replay$);
        super(
                merged,
                input.isNonValue,
                () => {
                },
                () => {
                }
        );
        this.replay$ = replay$;
    }

    replay(): void {
        if (this.hasValue()) {
            this.replay$.next(this.value);
        }
    }

}

export function replayable<T, X, S extends State<T, X>>(state: State<T, X>): ReplayableState<T, X> {
    let replayableState = new ReplayableState(state);
    Object.setPrototypeOf(Object.getPrototypeOf(replayableState), state);
    return replayableState as any;
}
