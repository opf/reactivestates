import {State} from "./State";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

export class ReplayableState<T> extends State<T> {

    private readonly replay$: Subject<T>;

    constructor(input: State<T>) {
        const replay$ = new Subject<T>();
        const merged = Observable.merge(input.changes$(), replay$);
        super(merged);
        this.replay$ = replay$;
    }

    replay(): void {
        if (this.hasValue()) {
            this.replay$.next(this.value);
        }
    }

}

export function replayable<T, S extends State<T>>(state: S): S & ReplayableState<T> {
    let replayableState = new ReplayableState(state);
    Object.setPrototypeOf(Object.getPrototypeOf(replayableState), state);
    return replayableState as any;
}
