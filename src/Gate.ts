import {Subject, Observable} from "rxjs";
import {DependentState} from "./DependentState";

export class Gate<T> extends DependentState<T> {

    private trigger$: Subject<boolean>;

    private input$: DependentState<T>;

    public readonly passOne: () => void;

    constructor(input: DependentState<T>) {
        const trigger = new Subject<boolean>();

        const stream: Observable<T> = trigger
                .withLatestFrom(input.observeAll(), (t, i) => i);

        super(stream);
        this.trigger$ = trigger;
        this.input$ = input;
        this.passOne = () => this.trigger$.next(true);
    }

    public isNonValue(val: any|T): boolean {
        return val === undefined || this.input$.isNonValue(val);
    }

}

export function gateFor<T>(input: DependentState<T>): Gate<T> {
    return new Gate(input);
}

