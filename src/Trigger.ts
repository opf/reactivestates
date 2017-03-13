import {Subject} from "rxjs";
import {DependentState} from "./DependentState";

export class Trigger extends DependentState<boolean> {

    private trigger$: Subject<boolean>;

    constructor(sink?: () => any) {
        let trigger = new Subject<boolean>();
        super(trigger);
        this.trigger$ = trigger;
        if (sink) {
            this.forEach(sink);
        }
    }

    trigger() {
        this.trigger$.next(true);
        this.trigger$.next(undefined);
    }

}

export function trigger(sink: () => any): Trigger {
    return new Trigger(sink);
}

