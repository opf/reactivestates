import {input} from "./InputState";
import {gateFor} from "./Gate";
import {combine} from "./Combiner";

describe("Gate", function () {

    it("does not pass input after creation", function () {
        const i1 = input(1);
        const gate = gateFor(i1);

        gate.values$().subscribe(() => {
            throw new Error();
        });
    });

    it("pass input after passOne()", function (done) {
        const i1 = input(1);
        const gate = gateFor(i1);

        gate.values$().subscribe(i => {
            assert.equal(i, 1);
            done();
        });

        gate.passOne();
    });

    it("pass inputs on every passOne() call", function () {
        const i1 = input(1);
        const gate = gateFor(i1);

        const values: number[] = [];
        gate.values$().subscribe(i => {
            values.push(i);
        });

        gate.passOne();
        i1.putValue(2);
        gate.passOne();

        assert.deepEqual(values, [1, 2]);
    });

    it("pass input after passOne() but not following values", function (done) {
        const i1 = input(1);
        const gate = gateFor(i1);

        gate.values$().subscribe(i => {
            assert.equal(i, 1);
        });

        gate.passOne();
        i1.putValue(2);

        done();
    });

    it("pass nonValue input with passOne", function (done) {
        const i1 = input<number>();
        const gate = gateFor(i1);

        let counter = 0;
        gate.nonValues$().subscribe(() => {
            // nonValuesSink will be called two times:
            // 1. nonValue state of gate
            // 2. nonvalue state from input after gate.passOne();

            counter++;
            if (counter === 2) {
                done();
            }
        });

        gate.passOne();
    });

    it("correctly passes nonValues and values", function () {
        const i1 = input<number>();
        const gate = gateFor(i1);

        let values: (number|undefined)[] = [];
        gate.changes$().subscribe(
                val => {
                    values.push(val);
                });

        gate.passOne();
        gate.passOne();
        i1.putValue(1);
        gate.passOne();
        gate.passOne();
        i1.putValue(2);
        gate.passOne();
        gate.passOne();
        i1.clear();
        gate.passOne();
        gate.passOne();

        assert.deepEqual(values, [undefined, undefined, undefined, 1, 1, 2, 2, undefined, undefined]);
    });

    it("correctly passes nonValues and values from a combined input", function () {
        const i1 = input<number>();
        const i2 = input<number>();
        const i3 = input<number>();
        const inputs = combine(i1, i2, i3);
        const gate = gateFor(inputs);

        let values: [boolean, any][] = [];
        gate.changes$().subscribe(
                (val: any) => {
                    values.push([inputs.isNonValue(val), val]);
                });

        gate.passOne();
        i1.putValue(1);
        gate.passOne();
        i2.putValue(2);
        gate.passOne();
        i3.putValue(3);
        gate.passOne();
        i2.clear();
        gate.passOne();

        assert.deepEqual(
                values,
                [
                    [true, undefined],
                    [true, [undefined, undefined, undefined]],
                    [true, [1, undefined, undefined]],
                    [true, [1, 2, undefined]],
                    [false, [1, 2, 3]],
                    [true, [1, undefined, 3]],
                ]
        );
    });

});
