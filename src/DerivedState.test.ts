import {input} from "./InputState";
import {derive, deriveRaw} from "./DerivedState";

describe("DerivedState", function () {

    it("can transform the changes$ stream with deriveRaw()", function () {
        const calls: string[] = [];

        const input$ = input<number>();
        const state2 = deriveRaw(input$, ($, input) => $
                .map(v => {
                    if (input.isNonValue(v)) {
                        return -1;
                    } else {
                        return v! + 1000;
                    }
                }));

        input$.changes$().subscribe(val => {
            calls.push("state1:" + JSON.stringify(val));
        });

        state2.changes$().subscribe(val => {
            calls.push("state2:" + JSON.stringify(val));
        });


        input$.putValue(1);
        input$.putValue(undefined);
        input$.putValue(2);

        assert.deepEqual(calls, [
            "state1:undefined",
            "state2:-1",
            "state1:1",
            "state2:1001",
            "state1:undefined",
            "state2:-1",
            "state1:2",
            "state2:1002",
        ]);
    });

    it("can transform the values$ stream with derive()", function () {
        const calls: string[] = [];

        const input$ = input<number>();
        const state2 = derive(input$, $ => $.map(v => v + 1000));

        input$.changes$().subscribe(val => {
            calls.push("state1:" + JSON.stringify(val));
        });

        state2.changes$().subscribe(val => {
            calls.push("state2:" + JSON.stringify(val));
        });


        input$.putValue(1);
        input$.putValue(undefined);
        input$.putValue(2);

        assert.deepEqual(calls, [
            "state1:undefined",
            "state2:undefined",
            "state1:1",
            "state2:1001",
            "state1:undefined",
            "state2:undefined",
            "state1:2",
            "state2:1002",
        ]);
    });

    it("does not execute the inner transformer without subscribers", function () {
        const input$ = input(1);
        deriveRaw(input$, $ => $
                .map(() => {
                    throw Error();
                }));
    });

    it("executes the inner transformer once an observer subscribes", function (done) {
        const input$ = input(1);
        const derived$ = deriveRaw(input$, $ => $
                .map(() => {
                    return "X";
                }));

        derived$.changes$().subscribe(v => {
            assert.equal(v, "X");
            done();
        });
    });

    it("does not execute the inner transformer once the last observer unsubscribes", function () {
        const calls: any[] = [];
        const input$ = input(1);
        const derived$ = deriveRaw(input$, $ => $
                .map(v => calls.push(v)));

        let sub1 = derived$.changes$().subscribe();

        input$.putValue(2);

        let sub2 = derived$.changes$().subscribe();

        input$.putValue(3);
        sub2.unsubscribe();
        input$.putValue(4);
        sub1.unsubscribe();
        input$.putValue(5);

        assert.deepEqual(calls, [1, 2, 3, 4]);
    });

    it("value() only has a value if an observer is subscribed", function () {
        const input$ = input(1);
        const derived$ = deriveRaw(input$, $ => $
                .map(() => {
                    return "X";
                }));

        assert.isUndefined(derived$.value);

        derived$.changes$().subscribe();
        assert.equal(derived$.value, "X");
    });

    it("in a chain of DependentState, only an observer triggers the inner transformers", function () {
        const calls: any[] = [];
        const input$ = input(1);
        const derived1$ = deriveRaw(input$, $ => $.map(() => calls.push(1)));
        const derived2$ = deriveRaw(derived1$, $ => $.map(() => calls.push(2)));
        const derived3$ = deriveRaw(derived2$, $ => $.map(() => calls.push(3)));

        assert.deepEqual(calls, []);

        derived3$.changes$().subscribe();

        assert.deepEqual(calls, [1, 2, 3]);
    });

    it("can have an initial value", function () {
        const calls: any[] = [];
        const input$ = input<number>();
        const derived$ = derive(input$, $ => $, 1);
        derived$.changes$().subscribe(v => calls.push(v));
        input$.putValue(2);
        assert.deepEqual(calls, [1, 2]);
    });

});
