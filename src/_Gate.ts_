import {Observable, Subject} from "rxjs";
import {State} from "./State";

export class Gate<T, X> extends State<T, X|undefined> {

    private readonly trigger$: Subject<boolean>;

    private readonly input$: State<T, X>;

    public readonly passOne: () => void;

    constructor(input: State<T, X>) {
        const trigger = new Subject<boolean>();

        const stream: Observable<T | X> = trigger
                .withLatestFrom(
                        input.changes$(),
                        (t, i) => i);

        super(
                stream,
                (val: any): val is X => input.isNonValue(val),
                (state, setState) => {
                    setState(undefined);
                }, (state, setState) => {
                    setState(undefined);
                });

        this.trigger$ = trigger;
        this.input$ = input;
        this.passOne = () => this.trigger$.next(true);
    }

}

export function gateFor<T, X>(input: State<T, X>): Gate<T, X> {
    return new Gate(input);
}

