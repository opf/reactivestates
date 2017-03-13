import {Subject} from "rxjs";
import {DependentState, dependent} from "./DependentState";

describe("DependentState", function () {

    it("is empty after creation", function () {
        const dummy = new Subject<number>();
        const s1 = dependent(dummy);
        assert.isFalse(s1.hasValue());
    });

    it("calls forEach", function (done) {
        const dummy = new Subject<number>();
        const s1 = dependent(dummy);
        dummy.next(1);
        s1.forEach(val => {
            assert.equal(val, 1);
            done();
        })
    });

    it("observeAll has 'undefined' state after creation", function (done) {
        const dummy = new Subject<number>();
        const s1 = dependent(dummy);
        s1.observeAll()
                .subscribe(i => {
                    assert.equal(i, undefined);
                    done();
                });
    });

    it("observeNonValues has 'undefined' state after creation", function (done) {
        const dummy = new Subject<number>();
        const s1 = dependent(dummy);
        s1.observeNonValues()
                .subscribe(i => {
                    assert.equal(i, undefined);
                    done();
                });
    });

    it("replays the last value", function (done) {
        const dummy = new Subject<number>();
        const s1 = dependent(dummy);
        dummy.next(1);
        s1.observeValues()
                .subscribe(i => {
                    assert.isTrue(s1.hasValue());
                    assert.equal(i, 1);
                    done();
                });
    });

    it("the value 'undefined' clears the state", function () {
        const dummy = new Subject<number>();
        const s1 = dependent(dummy);
        dummy.next(1);
        dummy.next(undefined);
        assert.isFalse(s1.hasValue());
    });

    it("clearing can be observed", function (done) {
        const dummy = new Subject<number>();
        const s1 = dependent(dummy);

        s1.observeNonValues()
                .skip(1)
                .subscribe(i => {
                    assert.equal(i, undefined);
                    assert.isFalse(s1.hasValue());
                    done();
                });

        dummy.next(1);
        dummy.next(undefined);
    });

    it("can be disconnected/connected", function (done) {
        const dummy = new Subject<number>();
        const s1 = dependent(dummy);
        s1.disconnect();
        dummy.next(1);
        assert.isFalse(s1.hasValue());
        s1.connect();
        dummy.next(2);
        assert.isTrue(s1.hasValue());
        s1.observeValues()
                .subscribe(i => {
                    assert.isTrue(s1.hasValue());
                    assert.equal(i, 2);
                    done();
                });
    });

    it("remembers the timestamp of the last value", function (done) {
        const dummy = new Subject<number>();
        const s1 = dependent(dummy);
        dummy.next(1);
        setTimeout(() => {
            assert.isTrue(s1.isValueOlderThan(1));
            done();
        }, 5);
    });

    it("value / nonValue states over time", function () {
        const value = new Subject<number>();
        const s1 = dependent(value);

        let calls: string[] = [];
        s1.observeNonValues().subscribe(v => calls.push("nonValue"));
        s1.observeValues().subscribe(v => calls.push("value:" + v));

        value.next(1);
        value.next(2);
        value.next(undefined);
        value.next(3);

        assert.deepEqual(calls, ["nonValue", "value:1", "value:2", "nonValue", "value:3"])
    });

    it("derive from another state", function () {
        const value = new Subject<number>();
        const state1 = dependent(value);

        const state2: DependentState<string> = dependent(state1, $ => $
                .map(v => v + 1000)
                .map(v => v.toString())
                .distinctUntilChanged());

        let calls: Array<string|undefined> = [];
        state2.observeAll().subscribe(v => calls.push(v));

        value.next(1);
        value.next(2);
        value.next(2); // to test distinctUntilChanged()
        value.next(undefined);
        value.next(3);

        assert.deepEqual(calls, [undefined, "1001", "1002", undefined, "1003"]);
    });

});
