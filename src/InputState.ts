import {Observable} from "rxjs/Observable";
import {take} from "rxjs/operators";
import {Subject} from "rxjs/Subject";
import {AfterConnectFn, AfterDisConnectFn, State} from "./State";

export class InputState<T> extends State<T, undefined> {

    private state: Subject<T>;

    private timestampOfLastPromise: number;

    constructor(initialValue: T | undefined) {
        const isNonValue = (val: T | undefined): val is undefined => {
            return val === undefined;
        };
        const afterConnect: AfterConnectFn<T, undefined> = (state, setStateFn) => {
            setStateFn(initialValue);
        };
        const afterDisConnect: AfterDisConnectFn<T, undefined> = (state, setStateFn) => {
            if (state.hasValue()) {
                setStateFn(undefined);
            }
        };

        const state = new Subject<T>();
        super(state, isNonValue, afterConnect, afterDisConnect);

        this.state = state;
        this.timestampOfLastPromise = -1;
    }

    putValue(val: T | undefined, reason?: string): this {
        this.state.next(val);
        return this;
    }

    clearAndPutFromPromise(promise: PromiseLike<T>): this {
        if (this.hasValue()) {
            this.clear();
        }
        this.timestampOfLastPromise = Date.now();
        promise.then(
                // success
                (value: T) => {
                    this.timestampOfLastPromise = -1;
                    this.putValue(value);
                },
                // error
                () => {
                    this.timestampOfLastPromise = -1;
                    this.clear();
                }
        );
        return this;
    }

    isPristine(): boolean {
        return !this.hasValue() && !this.hasActivePromiseRequest();
    }

    hasActivePromiseRequest() {
        return this.timestampOfLastPromise !== -1;
    }

    isPromiseRequestOlderThan(timeoutInMs: number): boolean {
        const ageValue = Date.now() - this.timestampOfLastPromise;
        return ageValue > timeoutInMs;
    }

    putFromPromiseIfPristine(calledIfPristine: () => PromiseLike<T>): this {
        if (this.isPristine()) {
            this.clearAndPutFromPromise(calledIfPristine());
        }
        return this;
    }

    clear(reason?: string): this {
        this.putValue(undefined);
        return this;
    }

    doModify(valueMapper: (val: T) => T | Observable<T>, or?: () => T | Observable<T>): this {
        if (this.hasValue()) {
            this.values$().pipe(take(1)).subscribe(oldVal => {
                let newInput = valueMapper(oldVal);
                if (newInput instanceof Observable) {
                    newInput.pipe(take(1)).subscribe(newVal => {
                        this.putValue(newVal);
                    });
                } else {
                    this.putValue(newInput);
                }
            });
        } else {
            let orInput = or!();
            if (orInput instanceof Observable) {
                orInput.pipe(take(1)).subscribe(newVal => {
                    this.putValue(newVal);
                });
            } else {
                this.putValue(orInput);
            }
        }
        return this;
    }

}

export function input<T>(initValue: T | undefined = undefined) {
    return new InputState(initValue);
}
