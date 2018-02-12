import {Subject} from "rxjs";
import {State} from "./State";

export class ToggleInput extends State<boolean, undefined> {

    private trigger$: Subject<boolean>;
    private state: boolean;

    constructor(initialState: boolean) {
        let trigger = new Subject<boolean>();
        super(
                trigger,
                (val: any): val is undefined => val === undefined,
                (state, setState) => {
                    setState(initialState);
                }, (state, setState) => {
                    setState(undefined);
                });
        this.trigger$ = trigger;
    }

    toggle() {
        this.state = !this.state;
        this.trigger$.next(this.state);
    }

}

export function toggleInput(state = false): ToggleInput {
    return new ToggleInput(state);
}

