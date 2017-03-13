import {Subject} from "rxjs";
import {DependentState} from "./DependentState";

export class Toggle extends DependentState<boolean> {

    private trigger$: Subject<boolean>;
    private state: boolean;

    constructor(state = false) {
        let trigger = new Subject<boolean>();
        super(trigger, state);
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

