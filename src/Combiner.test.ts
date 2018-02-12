import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subject} from "rxjs/Subject";
import {combine, CombinerState} from "./Combiner";
import {observableToState} from "./State";

describe("Combiner", function () {

    it("observeAll has '[undefined, undefined]' state after creation", function (done) {
        const dummy1 = new Subject<number>();
        const dummy2 = new Subject<number>();
        const state1 = observableToState(dummy1);
        const state2 = observableToState(dummy2);

        const combined: CombinerState<[number, number], [undefined, undefined]> = combine(state1, state2);
        combined.changes$()
                .subscribe(i => {
                    assert.deepEqual<any>(i, [undefined, undefined]);
                    done();
                });
    });

    it("observeNonValues has '[undefined, undefined]' state after creation", function (done) {
        const dummy1 = new Subject<number>();
        const dummy2 = new Subject<number>();
        const state1 = observableToState(dummy1);
        const state2 = observableToState(dummy2);

        const combined = combine(state1, state2);
        combined.nonValues$()
                .subscribe(i => {
                    assert.deepEqual<any>(i, [undefined, undefined]);
                    done();
                });
    });

    it("observeNonValues emits values while no all input states have a value", function (done) {
        const dummy1 = new Subject<number>();
        const dummy2 = new Subject<number>();
        const state1 = observableToState(dummy1);
        dummy1.next(1);

        const state2 = observableToState(dummy2);

        const combined = combine(state1, state2);

        combined.changes$()
                .subscribe(both => {
                    assert.deepEqual<any>(both, [1, undefined]);
                    done();
                });
    });

    it("observeValues emits values if all input states already have a value", function (done) {
        const dummy1 = new BehaviorSubject(1);
        const state1 = observableToState(dummy1);

        const dummy2 = new BehaviorSubject(2);
        const state2 = observableToState(dummy2);

        const combined = combine(state1, state2);
        combined.values$()
                .subscribe(both => {
                    assert.deepEqual(both, [1, 2]);
                    done();
                });
    });

    it("observeValues emits values once all input states have a value", function (done) {
        const dummy1 = new Subject<number>();

        const state1 = observableToState(dummy1);

        const dummy2 = new Subject<number>();
        const state2 = observableToState(dummy2);

        const combined = combine(state1, state2);

        combined.values$()
                .subscribe(both => {
                    assert.deepEqual(both, [1, 2]);
                    done();
                });

        dummy1.next(1);
        dummy2.next(2);
    });

    it("nonValues$ has the correct value after connect/disconnect", function () {
        const dummy1 = new Subject<number>();
        const state1 = observableToState(dummy1);

        const dummy2 = new Subject<number>();
        const state2 = observableToState(dummy2);

        const combined = combine(state1, state2);

        const calls: any[] = [];
        combined.nonValues$()
                .subscribe(val => {
                    calls.push(val);
                });

        combined.disconnect();
        combined.connect();
        combined.disconnect();
        combined.connect();

        assert.deepEqual<any>(calls, [
            [undefined, undefined],
            [undefined, undefined],
            [undefined, undefined]
        ]);
    });

    it("combine3", function (done) {
        const state1 = observableToState(new BehaviorSubject<number>(1));
        const state2 = observableToState(new BehaviorSubject<number>(2));
        const state3 = observableToState(new BehaviorSubject<number>(3));
        const combined = combine(state1, state2, state3);
        combined.values$()
                .subscribe(all => {
                    assert.deepEqual(all, [1, 2, 3]);
                    done();
                });
    });

    it("combine4", function (done) {
        const state1 = observableToState(new BehaviorSubject<number>(1));
        const state2 = observableToState(new BehaviorSubject<number>(2));
        const state3 = observableToState(new BehaviorSubject<number>(3));
        const state4 = observableToState(new BehaviorSubject<number>(4));
        const combined = combine(state1, state2, state3, state4);
        combined.values$()
                .subscribe(all => {
                    assert.deepEqual(all, [1, 2, 3, 4]);
                    done();
                });
    });

    it("combine5", function (done) {
        const state1 = observableToState(new BehaviorSubject<number>(1));
        const state2 = observableToState(new BehaviorSubject<number>(2));
        const state3 = observableToState(new BehaviorSubject<number>(3));
        const state4 = observableToState(new BehaviorSubject<number>(4));
        const state5 = observableToState(new BehaviorSubject<number>(5));
        const combined = combine(state1, state2, state3, state4, state5);
        combined.values$()
                .subscribe(all => {
                    assert.deepEqual(all, [1, 2, 3, 4, 5]);
                    done();
                });
    });

    it("combine6", function (done) {
        const state1 = observableToState(new BehaviorSubject<number>(1));
        const state2 = observableToState(new BehaviorSubject<number>(2));
        const state3 = observableToState(new BehaviorSubject<number>(3));
        const state4 = observableToState(new BehaviorSubject<number>(4));
        const state5 = observableToState(new BehaviorSubject<number>(5));
        const state6 = observableToState(new BehaviorSubject<number>(6));
        const combined = combine(state1, state2, state3, state4, state5, state6);
        combined.values$()
                .subscribe(all => {
                    assert.deepEqual(all, [1, 2, 3, 4, 5, 6]);
                    done();
                });
    });

});
