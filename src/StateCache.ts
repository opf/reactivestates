import {Observable, Subject} from "rxjs";
import {input, InputState} from "./InputState";
import {State} from "./State";

export class StateCache<T, S extends State<T>> extends InputState<{ [key: string]: S }> {

    private readonly change$ = new Subject<[string, T | undefined, S]>();

    private readonly remove$ = new Subject<string>();

    constructor(private stateFactory: () => S) {
        super({});
    }

    clear(): this {
        if (this.hasValue()) {
            for (let id in this.value!) {
                const state = this.value![id];
                state.disconnect();
            }
        }

        this.putValue({});
        return this;
    }

    get(id: string): S {
        const map = this.value!;
        if (map[id] === undefined) {
            const newState = this.stateFactory();
            map[id] = newState;
            newState.changes$()
                    .takeUntil(this.observeRemove().filter(val => val === id))
                    .subscribe(val => {
                        this.change$.next([id, val, newState]);
                    });
            this.putValue(map);
        }

        return map[id];
    }

    remove(id: string): S|undefined {
        const map = this.value!;
        const state = map[id];
        if (state !== undefined) {
            state.disconnect();
            delete map[id];
            this.putValue(map);
            this.remove$.next(id);
        }

        return state;
    }

    observeChange(): Observable<[string, T | undefined, S]> {
        return this.change$.asObservable();
    }

    observeRemove(): Observable<string> {
        return this.remove$.asObservable();
    }

}

export function stateCache<T, S extends State<T>>(stateFactory: () => S): StateCache<T, S> {
    return new StateCache(stateFactory);
}

export function inputStateCache<T>(): StateCache<T, InputState<T>> {
    return new StateCache(() => input<T>());
}
