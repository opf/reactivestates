import {Subject, Observable} from "rxjs";
import {DependentState} from "./DependentState";

export class InputState<T> extends DependentState<T> {

    private state: Subject<T>;

    private timestampOfLastPromise: number;

    constructor(initialValue: T|undefined) {
        const state = new Subject<T>();
        super(state.asObservable(), initialValue);

        this.stateValue = initialValue;
        this.state = state;
        this.timestampOfLastPromise = -1;
    }

    putValue(val: T|undefined): this {
        this.state.next(val);
        return this;
    }

    putFromPromise(promise: PromiseLike<T>): this {
        this.clear();
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
            this.putFromPromise(calledIfPristine());
        }
        return this;
    }

    clear(): this {
        this.putValue(undefined);
        return this;
    }

    doModify(valueMapper: (val: T) => T|Observable<T>, or?: () => T|Observable<T>): this {
        if (this.hasValue()) {
            this.observeValues().take(1).subscribe(oldVal => {
                let newInput = valueMapper(oldVal);
                if (newInput instanceof Observable) {
                    newInput.take(1).subscribe(newVal => {
                        this.putValue(newVal);
                    });
                } else {
                    this.putValue(newInput);
                }
            });
        } else {
            let orInput = or!();
            if (orInput instanceof Observable) {
                orInput.take(1).subscribe(newVal => {
                    this.putValue(newVal);
                });
            } else {
                this.putValue(orInput);
            }
        }
        return this;
    }

}

export function state<T>(initValue: T|undefined = undefined) {
    return new InputState(initValue);
}
