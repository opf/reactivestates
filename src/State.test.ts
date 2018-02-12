import {skip} from "rxjs/operators";
import {Subject} from "rxjs/Subject";
import {observableToState, State} from "./State";

describe("State", function () {

    it("has NonValue after creation", function () {
        const dummy = new Subject<number>();
        const s1: State<number, undefined> = observableToState(dummy);
        assert.isFalse(s1.hasValue());
    });

    it("future values can be subscribed with values$", function (done) {
        const dummy = new Subject<number>();
        const s1 = observableToState(dummy);
        s1.values$().subscribe(val => {
            assert.equal(val, 1);
            done();
        });
        dummy.next(1);
    });

    it("changes$ has 'undefined' state after creation", function (done) {
        const dummy = new Subject<number>();
        const s1 = observableToState(dummy);
        s1.changes$()
            .subscribe(i => {
                assert.equal(i, undefined);
                done();
            });
    });

    it("nonValues$ has 'undefined' state after creation", function (done) {
        const dummy = new Subject<number>();
        const s1 = observableToState(dummy);
        s1.nonValues$()
            .subscribe(i => {
                assert.equal(i, undefined);
                done();
            });
    });

    it("replays the last value", function (done) {
        const dummy = new Subject<number>();
        const s1 = observableToState(dummy);
        dummy.next(1);
        s1.values$()
            .subscribe(i => {
                assert.isTrue(s1.hasValue());
                assert.equal(i, 1);
                done();
            });
    });

    it("mapOr", () => {
        const dummy = new Subject<{ a: number }>();
        const s1 = observableToState(dummy);

        assert.equal(s1.mapOr(v => v.a, 1), 1);
        dummy.next({a: 2});
        assert.equal(s1.mapOr(v => v.a, 1), 2);
    });

    it("forEach", () => {
        const dummy = new Subject<number>();
        const s1 = observableToState(dummy);

        const calls: number[] = [];
        dummy.next(1);
        dummy.next(2);
        s1.forEach(v => calls.push(v));
        dummy.next(3);
        dummy.next(4);
        dummy.next(5);

        assert.deepEqual(calls, [2, 3, 4, 5]);
    });

    it("the value 'undefined' clears the state", function () {
        const dummy = new Subject<number>();
        const s1 = observableToState(dummy);
        dummy.next(1);
        dummy.next(undefined);
        assert.isFalse(s1.hasValue());
    });

    it("clearing can be observed", function (done) {
        const dummy = new Subject<number>();
        const s1 = observableToState(dummy);

        s1.nonValues$().pipe(
            skip(1))
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
        const s1 = observableToState(dummy);
        s1.disconnect();
        dummy.next(1);
        assert.isFalse(s1.hasValue());
        s1.connect();
        dummy.next(2);
        assert.isTrue(s1.hasValue());
        s1.values$()
            .subscribe(i => {
                assert.isTrue(s1.hasValue());
                assert.equal(i, 2);
                done();
            });
    });

    it("remembers the timestamp of the last value", function (done) {
        const dummy = new Subject<number>();
        const s1 = observableToState(dummy);
        dummy.next(1);
        setTimeout(() => {
            assert.isTrue(s1.isValueOlderThan(1));
            done();
        }, 5);
    });

    it("fires correctly when using valuesPromise", function (done) {
        const dummy = new Subject<number>();
        const s1 = observableToState(dummy);
        dummy.next(1);

        s1.valuesPromise().then(() => done());
    });

    it("counts the number of observers", function () {
        const dummy = new Subject<number>();
        const s1 = observableToState(dummy);
        assert.equal(s1.getSubscriberCount(), 0);
        const sub1 = s1.values$().subscribe(v => v);
        assert.equal(s1.getSubscriberCount(), 1);
        const sub2 = s1.values$().subscribe(v => v);
        assert.equal(s1.getSubscriberCount(), 2);
        sub1.unsubscribe();
        assert.equal(s1.getSubscriberCount(), 1);
        sub2.unsubscribe();
        assert.equal(s1.getSubscriberCount(), 0);
    });

    it("value / nonValue states over time", function () {
        const value = new Subject<number>();
        const s1 = observableToState(value);

        let calls: string[] = [];
        s1.nonValues$().subscribe(v => calls.push("nonValue"));
        s1.values$().subscribe(v => calls.push("value:" + v));

        value.next(1);
        value.next(2);
        value.next(undefined);
        value.next(3);

        assert.deepEqual(calls, ["nonValue", "value:1", "value:2", "nonValue", "value:3"]);
    });

});
