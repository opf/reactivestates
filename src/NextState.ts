import {Observable} from "rxjs";
import {Subject} from "rxjs/Subject";
import {AfterConnectFn, AfterDisConnectFn, State} from "./State";

type TriggerStates = "closed" | "one" | "all";

export class NextState<IT, OT> extends State<OT, undefined> {

    private readonly trigger$: Subject<TriggerStates>;

    private readonly inputState: State<IT, any>;

    constructor(state: State<IT, any>,
                transformer: ($: Observable<IT>, inputState: State<IT, any>) => Observable<OT | undefined>) {

        const trigger$ = new Subject<TriggerStates>();
        const input: Observable<IT> = Observable.combineLatest(
                state.outputStreamTrailing.filter(v => !state.isNonValue(v)),
                trigger$
        )
                .filter(([value, triggerState]) => {
                    if (triggerState === "one") {
                        this.trigger$.next("closed");
                        return true;
                    } else if (triggerState === "all") {
                        return true;
                    }

                    // trigger is closed
                    return false;
                })
                .map(([value]) => value);


        const values$: Observable<OT> = transformer(input, state);

        const nonValues$: Observable<undefined> =
                state.outputStreamTrailing.filter(v => state.isNonValue(v)).map(nonValue => undefined);

        const source$: Observable<OT | undefined> = Observable.merge(nonValues$, values$);

        const isNonValue = (val: OT | undefined): val is undefined => {
            return val === undefined;
        };

        const afterConnect: AfterConnectFn<OT, undefined> = (state, setStateFn) => {
            if (!state.hasValue()) {
                setStateFn(undefined);
            }
        };
        const afterDisConnect: AfterDisConnectFn<OT, undefined> = (state, setStateFn) => {
            setStateFn(undefined);
        };

        super(source$, isNonValue, afterConnect, afterDisConnect);
        this.inputState = state;
        this.trigger$ = trigger$;
    }

    passOne(): this {
        this.trigger$.next("one");
        return this;
    }

    passAll(): this {
        this.trigger$.next("all");
        return this;
    }

    passNone(): this {
        this.trigger$.next("closed");
        return this;
    }

    public getStateChain(): State<any, any>[] {
        return [...this.inputState.getStateChain(), this];
    }

}


export function next<IT, OT>(state: State<IT, any>,
                               transformer: ($: Observable<IT>, inputState: State<IT, any>) => Observable<OT | undefined>): NextState<IT, OT> {

    return new NextState<IT, OT>(state, transformer);
}
