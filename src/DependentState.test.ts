import {Subject} from "rxjs";
import {DependentState, dependent} from "./DependentState";
import {observableToState} from "./State";

describe("DependentState", function () {

    it("derive from another state", function () {
        const calls: string[] = [];

        const value = new Subject<number>();
        const state1 = observableToState(value);
        state1.changes$().subscribe(val => {
            calls.push("state1:" + JSON.stringify(val));
        });

        value.next(1);

        const state2: DependentState<number, string> = dependent(state1, $ => $
                .map(v => v + 1000)
                .map(v => v.toString())
                .distinctUntilChanged());

        state2.changes$().subscribe(val => {
            calls.push("state2:" + JSON.stringify(val));
        });


        value.next(2); // to test distinctUntilChanged()
        value.next(2); // to test distinctUntilChanged()
        value.next(undefined);
        value.next(3);

        assert.deepEqual(calls, [
            'state1:undefined',
            'state1:1',
            'state2:"1001"',
            'state1:2',
            'state2:"1002"',
            'state1:2',
            'state1:undefined',
            'state2:undefined',
            'state1:3',
            'state2:"1003"'
        ]);
    });

});
