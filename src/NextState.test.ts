import {input} from "./InputState";
import {next} from "./NextState";

describe("NextState", function () {

    it("does not pass values per default", function () {
        const si = input<number>(1);
        const sn = next(si, $ => $);
        assert.isFalse(sn.hasValue());
    });

    it("passes a value after passOne(), if the input already had a value", function () {
        const si = input<number>(1);
        const sn = next(si, $ => $);
        sn.passOne();
        assert.equal(sn.value, 1);
    });

    it("passes a value after passOne(), if the input receives the value after the call", function () {
        const si = input<number>();
        const sn = next(si, $ => $);
        sn.passOne();
        si.putValue(1);
        assert.equal(sn.value, 1);
    });

    it("passes values after passAll() (input already had one value)", function () {
        const calls: number[] = [];
        const si = input<number>(1);
        const sn = next<number, number>(si, $ => $);
        sn.forEach(v => calls.push(v));

        sn.passAll();
        si.putValue(2);
        si.putValue(3);

        assert.deepEqual(calls, [1, 2, 3]);
    });

    it("stops passing values after passNone()", function () {
        const calls: number[] = [];
        const si = input<number>();
        const sn = next<number, number>(si, $ => $);
        sn.forEach(v => calls.push(v));

        sn.passAll();
        si.putValue(1);
        si.putValue(2);
        sn.passNone();
        si.putValue(3);

        assert.deepEqual(calls, [1, 2]);
    });


});
