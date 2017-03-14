import {InputState} from "./InputState";
import {State} from "./Component";
import {Observable, Subject} from "rxjs";

export class StateMap<T, S extends State<T>> extends InputState<{[key: string]: S}> {

    private readonly change$ = new Subject<[string, T|undefined, S]>();

    private readonly remove$ = new Subject<string>();

    constructor(private stateFactory: () => S) {
        super({});
    }

    clear(): this {
        for (let id in this.val) {
            const state = this.val[id];
            state.disconnect();
        }

        this.putValue({});
        return this;
    }

    get(id: string): S {
        this.doModify(map => {
            if (map[id] == undefined) {
                const newState = this.stateFactory();
                map[id] = newState;
                newState.observeAll()
                        .takeUntil(this.observeRemove().filter(val => val === id))
                        .subscribe(val => {
                            this.change$.next([id, val, newState]);
                        });
            }
            return map;
        });

        return this.val[id];
    }

    remove(id: string): S {
        this.doModify(map => {
            const state = map[id];
            state && state.disconnect();
            delete map[id];
            this.remove$.next(id);
            return map;
        });

        return this.val[id];
    }

    observeChange(): Observable<[string, T|undefined, S]> {
        return this.change$.asObservable();
    }

    observeRemove(): Observable<string> {
        return this.remove$.asObservable();
    }

}

export function stateMap<T, S extends State<T>>(stateFactory: () => S) {
    return new StateMap(stateFactory);
}
