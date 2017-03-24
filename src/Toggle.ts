import {Subject} from "rxjs";
import {State} from "./State";

export class Toggle extends State<boolean> {

    private trigger$: Subject<boolean>;
    private state: boolean;

    constructor(initialState: boolean) {
        let trigger = new Subject<boolean>();
        super(trigger, initialState);
        this.trigger$ = trigger;
    }

    toggle() {
        this.state = !this.state;
        this.trigger$.next(this.state);
    }

}

export function toggle(state = false): Toggle {
    return new Toggle(state);
}

