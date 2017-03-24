import {Subject} from "rxjs";
import {State} from "./State";

export class Trigger extends State<boolean> {

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

