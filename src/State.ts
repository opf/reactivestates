import {Observable, ReplaySubject, Subscription} from "rxjs";
import {Observer} from "rxjs/Observer";
import {Subject} from "rxjs/Subject";
import {logStateChange} from "./log";

export type IsNonValueFn<T, X> = (x: T | X) => x is X;
export type AfterConnectFn<T, X> = (state: State<T, X>, setStateFn: (val: T | X) => void) => void;
export type AfterDisConnectFn<T, X> = (state: State<T, X>, setStateFn: (val: T | X) => void) => void;

export class State<T, X = undefined> {

    public name: string|null = null;

    public logEnabled = false;

    public pristine = true;

    public outputStreamTrailing: Subject<T | X> = new ReplaySubject<T | X>(1);

    protected stateValue: T | X;

    private inputStream: Observable<T | X>;

    private sourceSubscription: Subscription | undefined;

    private observerCount = 0;

    private timestampOfLastValue = -1;

    private outputStream: Subject<T | X> = new ReplaySubject<T | X>(1);

    private value$: Observable<T> = this.outputStream.filter(v => !this.isNonValue(v));

    private nonValue$: Observable<X> = this.outputStream.filter(v => this.isNonValue(v));

    constructor(source$: Observable<T | X>,
                public readonly isNonValue: (val: T | X) => val is X,
                private readonly afterConnect: AfterConnectFn<T, X>,
                private readonly afterDisconnect: AfterDisConnectFn<T, X>
                /*private readonly getNonValue: () => X*/) {

        this.inputStream = source$;
        this.connect();
    }

    public connect(): this {
        if (this.isConnected()) {
            this.disconnect();
        }
        this.sourceSubscription = this.inputStream
                .subscribe(val => {
                    this.setInnerValue(val);
                });

        this.afterConnect(this, this.setInnerValue.bind(this));
        return this;
    }

    public disconnect(): this {
        // if (this.hasValue()) {
        //     this.setInnerValue(this.getNonValue());
        // }
        this.afterDisconnect(this, this.setInnerValue.bind(this));

        this.sourceSubscription && this.sourceSubscription.unsubscribe();
        this.sourceSubscription = undefined;
        this.pristine = true;
        return this;
    }

    public isConnected(): boolean {
        return this.sourceSubscription !== undefined;
    }

    public isValueOlderThan(timeoutInMs: number): boolean {
        const ageValue = Date.now() - this.timestampOfLastValue;
        return ageValue > timeoutInMs;
    }

    /**
     * Returns true if this state has a value.
     */
    public hasValue(): boolean {
        return !this.isNonValue(this.stateValue);
    }

    public changes$(reason?: string): Observable<T | X> {
        return this.wrapObserve(this.outputStream.asObservable(), reason);
    }

    public changesPromise(): PromiseLike<T | X> {
        return this.changes$().take(1).toPromise();
    }

    public values$(reason?: string): Observable<T> {
        return this.wrapObserve(this.value$, reason);
    }

    public valuesPromise(): PromiseLike<T | undefined> {
        return this.values$().take(1).toPromise();
    }

    public nonValues$(reason?: string): Observable<X> {
        return this.wrapObserve(this.nonValue$, reason);
    }

    public nonValuesPromise(): PromiseLike<T | X> {
        return this.nonValues$().take(1).toPromise();
    }

    public get value(): T | X {
        return this.stateValue;
    }

    public getValueOr<B>(or: B): T | B {
        return this.hasValue() ? this.value as T : or;
    }

    public mapOr<R>(fn: (v: T) => R, orValue: R): R {
        if (this.hasValue()) {
            return fn(this.value as T);
        } else {
            return orValue;
        }
    }

    public forEach(fn: (v: T) => void): this {
        this.values$().subscribe(v => fn(v));
        return this;
    }

    public get text(): string {
        return this.hasValue() ? this.value!.toString() : "";
    }

    public getSubscriberCount(): number {
        return this.observerCount;
    }

    public hasSubscribers(): boolean {
        return this.getSubscriberCount() > 0;
    }

    public getStateChain(): State<any, any>[] {
        return [this];
    }

    protected onObserverSubscribed(): void {
    }

    protected onObserverUnsubscribed(): void {
    }

    protected log() {
        logStateChange(this, this.getStateChain());
    }

    protected setInnerValue(val: T | X): void {
        this.stateValue = val;
        this.pristine = false;

        if (this.logEnabled) {
            this.log();
        }

        if (!this.isNonValue(val)) {
            this.timestampOfLastValue = Date.now();
        } else {
            this.timestampOfLastValue = -1;
        }

        this.outputStream.next(val);
        this.outputStreamTrailing.next(val);
    }

    private wrapObserve<O extends T | X>($: Observable<O>, reason?: string): Observable<O> {
        return Observable.create((subscriber: Observer<O>) => {
            this.observerCount++;
            this.onObserverSubscribed();
            const sub = $.subscribe(
                    val => {
                        if (reason !== undefined) {
                            // TODO
                            // this.log("-> " + reason);
                        }
                        subscriber.next(val);
                    }, error => {
                        subscriber.error(error);
                    }, () => {
                        subscriber.complete();
                    }
            );

            return () => {
                sub.unsubscribe();
                this.observerCount--;
                this.onObserverUnsubscribed();
            };
        });
    }

}

export function observableToState<T>(input$: Observable<T | undefined>): State<T, undefined> {
    return new State<T, undefined>(
            input$,
            (x): x is undefined => x === undefined,
            (state, setStateFn) => {
                if (state.pristine) {
                    setStateFn(undefined);
                }
            }, (state, setStateFn) => {
                if (state.hasValue()) {
                    setStateFn(undefined);
                }
            });
}

