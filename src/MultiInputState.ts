import {Observable, Subject} from "rxjs";
import {filter, takeUntil} from "rxjs/operators";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {input, InputState} from "./InputState";
import {AfterConnectFn, AfterDisConnectFn, State} from "./State";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

export type Cache<T> = { [key: string]: InputState<T> };

export class MultiInputState<T> extends State<Cache<T>, undefined> {

    private readonly cache$: Subject<Cache<T>>;

    private readonly change$: Subject<[string, T | undefined, InputState<T>]>;

    private readonly remove$: Subject<string>;

    // private cache: Cache<T>;

    constructor() {
        // const cache: Cache<T> = {};
        const cache$: Subject<Cache<T>> = new ReplaySubject<Cache<T>>(1);

        const afterConnect: AfterConnectFn<Cache<T>, undefined> = (state, setStateFn) => {
            setStateFn({});
        };
        const afterDisConnect: AfterDisConnectFn<Cache<T>, undefined> = (state, setStateFn) => {
            this.clear();
            setStateFn({});
        };

        super(
                cache$.asObservable(),
                (val: any): val is undefined => val === undefined,
                afterConnect,
                afterDisConnect);

        this.cache$ = cache$;
        this.change$ = new Subject();
        this.remove$ = new Subject();
    }

    clear(): this {
        for (let id in this.value!) {
            const state = this.value![id];
            state.disconnect();
        }

        this.cache$.next({});

        return this;
    }

    get(id: string): InputState<T> {
        if (this.value![id] === undefined) {
            const newState = input<T>();
            if (this.name) {
                newState.name = this.name + "[" + id + "]";
            }
            this.value![id] = newState;
            newState.changes$().pipe(
                    takeUntil(this.observeRemove().pipe(filter(val => val === id))))
                    .subscribe(val => {
                        this.change$.next([id, val, newState]);
                    });
            this.cache$.next(this.value!);
        }

        return this.value![id];
    }

    remove(id: string): InputState<T> | undefined {
        const state = this.value![id];
        if (state !== undefined) {
            state.disconnect();
            delete this.value![id];
            this.cache$.next(this.value!);
            this.remove$.next(id);
        }

        return state;
    }

    observeChange(): Observable<[string, T | undefined, InputState<T>]> {
        return this.change$.asObservable();
    }

    observeRemove(): Observable<string> {
        return this.remove$.asObservable();
    }

}

export function multiInput<T>(): MultiInputState<T> {
    return new MultiInputState<T>();
}
