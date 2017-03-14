import {Observable, Subscription, ReplaySubject} from "rxjs";
import {State} from "./Component";


export class DependentState<T> extends State<T> {

    private sourceSubscription: Subscription|undefined;

    protected stateValue: T|undefined;

    private timestampOfLastValue = -1;

    private source$: Observable<T|undefined>;

    private stream$ = new ReplaySubject<T|undefined>(1);

    private value$ = this.stream$.filter(v => !this.isNonValue(v));

    private nonValue$ = this.stream$.filter(v => this.isNonValue(v));

    constructor(source$: Observable<T|undefined>, initialValue: T|undefined = undefined) {
        super();
        this.source$ = source$.startWith(initialValue);
        this.connect();
    }

    public connect(): this {
        this.disconnect();
        this.sourceSubscription = this.source$
                .map(val => {
                    this.setInnerValue(val);
                })
                .subscribe();

        return this;
    }

    public disconnect(): this {
        this.sourceSubscription && this.sourceSubscription.unsubscribe();
        this.sourceSubscription = undefined;
        this.stateValue = undefined;
        return this;
    }

    public isConnected(): boolean {
        return this.sourceSubscription != undefined;
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
        this.observeValues().subscribe(valuesSink);
        this.observeNonValues().subscribe(nonValuesSink);
        return this;
    }

    public observeAll(): Observable<T|undefined> {
        return this.stream$.asObservable();
    }

    public observeValues(): Observable<T> {
        return this.value$;
    }

    public observeNonValues(): Observable<T|undefined> {
        return this.nonValue$;
    }

    public isNonValue(val: T|undefined): boolean {
        return val === undefined;
    }

    public get val(): T {
        return this.stateValue!;
    }

    private setInnerValue(val: T|undefined): void {
        this.stateValue = val;

        if (!this.isNonValue(val)) {
            this.timestampOfLastValue = Date.now();
        } else {
            this.timestampOfLastValue = -1;
        }

        this.stateSetWrapper(() => {
            this.stream$.next(val);
        });
    }

}


export function dependent<I, T>(state: State<I>,
                            transformer: ($: Observable<I>) => Observable<T>): DependentState<T>;

export function dependent<T>(source: Observable<T|undefined>): DependentState<T>;

export function dependent<I, T>(source: Observable<T>|State<I>,
                            transformer?: ($: Observable<I>) => Observable<T>): DependentState<T> {

    if (source instanceof State) {
        if (transformer) {
            const values$ = transformer(source.observeValues());
            const nonValues$ = source.observeNonValues();
            source = Observable.merge(values$, nonValues$);
        } else {
            throw new TypeError("transformer must be defined");
        }
    }

    return new DependentState(source);
}

