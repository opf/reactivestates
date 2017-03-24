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
        this.doModify(map => {
            if (map[id] == undefined) {
                const newState = this.stateFactory();
                map[id] = newState;
                newState.changes$()
                        .takeUntil(this.observeRemove().filter(val => val === id))
                        .subscribe(val => {
                            this.change$.next([id, val, newState]);
                        });
            }
            return map;
        });

        return this.value![id];
    }

    remove(id: string): S {
        this.doModify(map => {
            const state = map[id];
            state && state.disconnect();
            delete map[id];
            this.remove$.next(id);
            return map;
        });

        return this.value![id];
    }

    observeChange(): Observable<[string, T | undefined, S]> {
        return this.change$.asObservable();
    }

    observeRemove(): Observable<string> {
        return this.remove$.asObservable();
    }

}

export function stateCache<T, S extends State<T>>(stateFactory: () => S) {
    return new StateCache(stateFactory);
}

export function inputStateCache<T>() {
    return new StateCache(() => input<T>());
}
