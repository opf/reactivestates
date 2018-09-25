import {assert} from "chai";
import {filter, map} from "rxjs/operators";
import {derive, deriveRaw} from "./DerivedState";
import {input} from "./InputState";

describe("DerivedState", function () {

    it("can transform the changes$ stream with deriveRaw()", function () {
        const calls: string[] = [];

        const input$ = input<number>();
        input$.logEnabled = true;

        const derived = deriveRaw(
            input$,
            ($, input) => $.pipe(
                map(v => {
                    if (input.isNonValue(v)) {
                        return -1;
                    } else {
                        return v + 1000;
                    }
                })));

        input$.changes$().subscribe(val => {
            calls.push("input:" + JSON.stringify(val));
        });

        derived.changes$().subscribe(val => {
            calls.push("derived:" + JSON.stringify(val));
        });

        input$.putValue(1);
        input$.putValue(undefined);
        input$.putValue(2);

        assert.deepEqual(calls, [
            "input:undefined",
            "derived:-1",

            "input:1",
            "derived:1001",

            "input:undefined",
            "derived:-1",

            "input:2",
            "derived:1002"
        ]);
    });

    it("can transform the values$ stream with derive()", function () {
        const calls: string[] = [];

        const input$ = input<number>();

        const state2 = derive<number, number>(input$, $ => $.pipe(map(v => v + 1000)));

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

    it("inherits the cleared-state from its input", function () {
        const input$ = input<number>(1);
        const derived = derive(input$, $ => $.pipe(map(v => v + 1000)));
        derived.values$().subscribe();

        assert.equal(input$.value, 1);
        assert.equal(derived.value, 1001);
        input$.clear();
        assert.isFalse(input$.hasValue());
        assert.isFalse(derived.hasValue());
    });

    it("can filter/limit the input stream", function () {
        const input$ = input<number>(1);
        const derived = derive(input$, $ => $.pipe(filter(v => v === 2)));
        derived.values$().subscribe();

        assert.equal(input$.value, 1);
        assert.isFalse(derived.hasValue());
        input$.putValue(2);
        assert.equal(input$.value, 2);
        assert.isTrue(derived.hasValue());
    });

    it("can switch to a cleared state independent from its input", function () {
        const input$ = input<number>(1);
        const derived = derive(input$, $ => $.pipe(map(v => v === 2 ? undefined : v)));
        derived.values$().subscribe();

        assert.equal(input$.value, 1);
        assert.equal(derived.value, 1);
        input$.putValue(2);
        assert.equal(input$.value, 2);
        assert.isFalse(derived.hasValue());
    });

    it("can have an initial value", function () {
        const calls: any[] = [];
        const input$ = input<number>();
        const derived$ = derive(input$, $ => $, 1);
        derived$.changes$().subscribe(v => calls.push(v));
        input$.putValue(2);
        assert.deepEqual(calls, [1, 2]);
    });

    it("initial value is only used at the beginning, not as a replacement for cleared", function () {
        const calls: any[] = [];
        const input$ = input<number>();
        const derived$ = derive(input$, $ => $, 1);
        derived$.changes$().subscribe(v => calls.push(v));
        input$.putValue(2);
        input$.clear();
        assert.deepEqual(calls, [1, 2, undefined]);
    });

});
