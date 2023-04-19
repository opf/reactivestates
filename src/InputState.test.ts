import {assert} from "chai";
import { firstValueFrom, of, timer } from "rxjs";
import {take} from "rxjs/operators";
import {input} from "./InputState";


describe("InputState", function () {

    it("is empty after creation", function () {
        const s1 = input();
        assert.isFalse(s1.hasValue());

        s1.values$().subscribe(() => {
            throw new Error();
        });
    });

    it("can have an initial value", function (done) {
        const s1 = input(5);
        s1.changes$().subscribe(i => {
            assert.equal(i, 5);
            done();
        });
    });

    it("replays the initial value on every connect", function () {
        const values: any[] = [];
        const s1 = input(5);
        s1.changes$().subscribe(i => {
            values.push(i);
        });

        s1.disconnect();
        s1.connect();
        s1.disconnect();
        s1.connect();

        assert.deepEqual(values, [5, undefined, 5, undefined, 5]);
    });

    it("broadcasts value", function (done) {
        const s1 = input<number>();
        s1.putValue(1);
        s1.changes$().subscribe(i => {
            assert.equal(i, 1);
            done();
        });
    });

    it("can be cleared", function () {
        const s1 = input(5);
        s1.clear();
        s1.values$().subscribe(() => {
            throw new Error("state should be cleared");
        });
    });

    it("can modify the state from a value", function (done) {
        const s1 = input(5);
        s1.doModify(val => val + 1);
        s1.values$().subscribe(val => {
            assert.equal(val, 6);
            done();
        });
    });

    it("can modify the state from Observable", function (done) {
        const s1 = input(5);
        s1.doModify(val => of(val + 1));
        s1.values$().subscribe(val => {
            assert.equal(val, 6);
            done();
        });
    });

    it("can modify the state if it has a nonValue", function (done) {
        const s1 = input();

        s1.doModify(() => {
            throw new Error("must not be called");
        }, () => 9);

        s1.values$().subscribe(val => {
            assert.equal(val, 9);
            done();
        });
    });

    it("calls doOnValue with initial value of 0", function (done) {
        const s1 = input(0);
        s1.values$().subscribe(val => {
            assert.equal(val, 0);
            done();
        });
    });

    it("putFromPromise", function (done) {
        const s1 = input(0);
        s1.clearAndPutFromPromise(firstValueFrom(timer(0)));
        assert.isFalse(s1.hasValue());
        s1.values$().subscribe(val => {
            assert.equal(val, 0);
            assert.isTrue(s1.hasValue());
            done();
        });
    });

    it("hasActivePromiseRequest", function (done) {
        const s1 = input(0);
        s1.clearAndPutFromPromise(firstValueFrom(timer(0)));
        assert.isFalse(s1.hasValue());
        assert.isTrue(s1.hasActivePromiseRequest());

        s1.values$().subscribe(val => {
            assert.equal(val, 0);
            assert.isTrue(s1.hasValue());
            assert.isFalse(s1.hasActivePromiseRequest());
            done();
        });
    });

    it("isPristine", function () {
        const s1 = input<number>();
        assert.isTrue(s1.isPristine());
        s1.clearAndPutFromPromise(firstValueFrom(timer(0)));
        assert.isFalse(s1.isPristine());
        assert.isFalse(s1.hasValue());
    });

    it("putFromPromiseIfPristine", function (done) {
        const s1 = input<number>();

        s1.putFromPromiseIfPristine(() => firstValueFrom(timer(0)));
        assert.isTrue(s1.hasActivePromiseRequest());
        assert.isFalse(s1.hasValue());

        s1.putFromPromiseIfPristine(() => {
            throw new Error("must not be called");
        });

        s1.values$().subscribe(val => {
            assert.equal(val, 0);
            assert.isTrue(s1.hasValue());
            assert.isFalse(s1.hasActivePromiseRequest());
            done();
        });
    });

});
