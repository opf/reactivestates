import {Observable, Subject} from "rxjs";
import {State} from "./State";

export class Gate<T> extends State<T> {

    private trigger$: Subject<boolean>;

    private input$: State<T>;

    public readonly passOne: () => void;

    constructor(input: State<T>) {
        const trigger = new Subject<boolean>();

        const stream: Observable<T> = trigger
                .withLatestFrom(input.changes$(), (t, i) => i);

        super(stream);
        this.trigger$ = trigger;
        this.input$ = input;
        this.passOne = () => this.trigger$.next(true);
    }

    public isNonValue(val: any|T): boolean {
        return val === undefined || this.input$.isNonValue(val);
    }

}

export function gateFor<T>(input: State<T>): Gate<T> {
    return new Gate(input);
}

