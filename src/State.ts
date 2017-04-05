import {Observable, ReplaySubject, Subscription} from "rxjs";

let unnamedStateCounter = 0;

export class State<T> {

    public name = "unnamed-" + unnamedStateCounter++;

    public logEnabled = false;

    protected stateValue: T | undefined;

    private sourceSubscription: Subscription | undefined;

    private timestampOfLastValue = -1;

    private source$: Observable<T | undefined>;

    private innerStream = new ReplaySubject<T | undefined>(1);

    private value$ = this.innerStream.filter(v => !this.isNonValue(v));

    private nonValue$ = this.innerStream.filter(v => this.isNonValue(v));

    constructor(source$: Observable<T | undefined>, private initialValue?: T | undefined) {
        this.source$ = source$;
        this.connect();
    }

    public connect(): this {
        this.disconnect();
        this.sourceSubscription = this.source$
                .startWith(this.initialValue)
                .map(val => {
                    this.setInnerValue(val);
                })
                .subscribe();

        return this;
    }

    public disconnect(): this {
        if (this.hasValue()) {
            this.setInnerValue(undefined);
        }
        this.sourceSubscription && this.sourceSubscription.unsubscribe();
        this.sourceSubscription = undefined;
        this.stateValue = undefined;
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

    public forEach(valuesSink: (val: T) => any, nonValuesSink?: (val: T) => any): this {
        this.values$().subscribe(valuesSink);
        this.nonValues$().subscribe(nonValuesSink);
        return this;
    }

    public changes$(reason?: string): Observable<T | undefined> {
        return this.wrapObserve(this.innerStream.asObservable(), reason);
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
        return this.stateValue!;
    }

    public getValueOr<B>(or: B): T | B {
        return this.hasValue() ? this.value! : or;
    }

    public get valueString(): string {
        return this.hasValue() ? this.value!.toString() : "";
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
        return reason === undefined || !this.logEnabled
                ? $
                : $.do(() => this.log("-> " + reason));
    }

    private setInnerValue(val: T | undefined): void {
        if (this.logEnabled) {
            this.logNewState(val);
        }
        this.stateValue = val;

        if (!this.isNonValue(val)) {
            this.timestampOfLastValue = Date.now();
        } else {
            this.timestampOfLastValue = -1;
        }

        this.innerStream.next(val);
    }

}

export function observableToState<T>(input$: Observable<T | undefined>): State<T> {
    return new State(input$);
}
