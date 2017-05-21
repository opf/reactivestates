import {Observable, ReplaySubject, Subscription} from "rxjs";
import {Observer} from "rxjs/Observer";

let unnamedStateCounter = 0;

export class State<T> {

    public name = "unnamed-state-" + unnamedStateCounter++;

    public logEnabled = false;

    protected pristine = true;

    protected stateValue: T | undefined;

    private inputStream: Observable<T | undefined>;

    private sourceSubscription: Subscription | undefined;

    private observerCount = 0;

    private timestampOfLastValue = -1;

    private outputStream = new ReplaySubject<T | undefined>(1);

    private value$ = this.outputStream.filter(v => !this.isNonValue(v));

    private nonValue$ = this.outputStream.filter(v => this.isNonValue(v));

    constructor(source$: Observable<T | undefined>, private initialValue?: T | undefined) {
        this.inputStream = source$;
        this.connect();
    }

    public connect(): this {
        this.disconnect();
        this.sourceSubscription = this.inputStream
                // .startWith(this.initialValue)
                .subscribe(val => {
                    this.setInnerValue(val);
                });

        if (this.isSetValueAfterConnect()) {
            this.setInnerValue(this.initialValue);
        }

        return this;
    }

    public disconnect(): this {
        if (this.hasValue()) {
            this.setInnerValue(undefined);
        }
        this.sourceSubscription && this.sourceSubscription.unsubscribe();
        this.sourceSubscription = undefined;
        this.stateValue = undefined;
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

    public changes$(reason?: string): Observable<T | undefined> {
        return this.wrapObserve(this.outputStream.asObservable(), reason);
    }

    public changesPromise(): PromiseLike<T | undefined> {
        return this.changes$().take(1).toPromise();
    }

    public values$(reason?: string): Observable<T> {
        return this.wrapObserve(this.value$, reason);
    }

    public valuesPromise(): PromiseLike<T | undefined> {
        return this.values$().take(1).toPromise();
    }

    public nonValues$(reason?: string): Observable<T | undefined> {
        return this.wrapObserve(this.nonValue$, reason);
    }

    public nonValuesPromise(): PromiseLike<T | undefined> {
        return this.nonValues$().take(1).toPromise();
    }

    public isNonValue(val: T | undefined): boolean {
        return val === undefined;
    }

    public get value(): T | undefined {
        return this.stateValue;
    }

    public getValueOr<B>(or: B): T | B {
        return this.hasValue() ? this.value! : or;
    }

    public get text(): string {
        return this.hasValue() ? this.value!.toString() : "";
    }

    public getObserverCount() {
        return this.observerCount;
    }

    protected isSetValueAfterConnect(): boolean {
        return this.pristine;
    }

    protected onObserverSubscribed(): void {
    }

    protected onObserverUnsubscribed(): void {
    }

    protected logNewState(value: T | undefined) {
        let stringify = "undefined";
        if (value !== undefined) {
            stringify = value.toString();
            stringify = stringify.length > 50 ? stringify.substr(0, 50) + "..." : stringify;
        }

        this.log("= " + stringify);
    }

    protected log(message: string) {
        console.log("[" + this.name + "] " + message);
    }

    private wrapObserve($: Observable<T>, reason?: string): Observable<T> {
        return Observable.create((subscriber: Observer<T>) => {
            this.observerCount++;
            this.onObserverSubscribed();
            $.subscribe(
                    val => {
                        if (reason !== undefined) {
                            this.log("-> " + reason);
                        }
                        subscriber.next(val);
                    }, error => {
                        subscriber.error(error);
                    }, () => {
                        subscriber.complete();
                    }
            );

            return () => {
                this.observerCount--;
                this.onObserverUnsubscribed();
            };
        });
    }

    private setInnerValue(val: T | undefined): void {
        // console.log(this.name, "setInnerValue", val);
        this.pristine = false;
        if (this.logEnabled) {
            this.logNewState(val);
        }
        this.stateValue = val;

        if (!this.isNonValue(val)) {
            this.timestampOfLastValue = Date.now();
        } else {
            this.timestampOfLastValue = -1;
        }

        this.outputStream.next(val);
    }

}

export function observableToState<T>(input$: Observable<T | undefined>): State<T> {
    return new State(input$);
}

