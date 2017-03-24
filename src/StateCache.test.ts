import {input} from "./InputState";
import {inputStateCache, stateCache} from "./StateCache";

describe("StateCache", function () {

    it("is empty after creation", function () {
        const s = stateCache(() => input<string>());
        assert.deepEqual(s.value, {});
    });

    it("fills previously requested states", function () {
        const s = inputStateCache();
        let stateA = s.get("a");
        const calls: any[] = [];
        stateA.changes$().subscribe(val => {
            calls.push(val);
        });
        stateA.putValue("a");
        assert.deepEqual(calls, [undefined, "a"])
    });

    it("can remove entries", function () {
        const s = stateCache(() => input<string>());
        s.get("a").putValue("a");
        s.remove("a");
        assert.deepEqual(s.value, {});
    });

    it("removing a states also disconnects it", function () {
        const sm = stateCache(() => input<string>());
        const stateA = sm.get("a");
        stateA.putValue("a");
        assert.isTrue(stateA.isConnected());
        sm.remove("a");
        assert.isFalse(stateA.isConnected());
    });

    it("change events can be observed", function (done) {
        const sm = stateCache(() => input<string>());

        let callCount = 0;
        sm.observeChange().subscribe(([key, val, state]) => {
            if (callCount === 0) {
                assert.isUndefined(val);
            } else {
                assert.equal(key, "a");
                assert.equal(val, "a");
                assert.equal(state.value, "a");
                done();
            }
            callCount++;
        });

        sm.get("a").putValue("a");
    });

    it("remove events can be observed", function (done) {
        const sm = stateCache(() => input<string>());
        sm.get("a").putValue("a");

        sm.observeRemove()
                .filter(val => val === "a")
                .subscribe(key => {
                    assert.equal(key, "a");
                    done();
                });

        sm.remove("a");

    });

});
