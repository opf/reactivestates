import {multiInput} from "./MultiInputState";

describe("StateCache", function () {

    it("is empty after creation", function () {
        const s = multiInput<string>();
        assert.deepEqual(s.value, {});
    });

    it("fills previously requested states", function () {
        const s = multiInput<string>();
        let stateA = s.get("a");
        const calls: any[] = [];
        stateA.changes$().subscribe(val => {
            calls.push(val);
        });
        stateA.putValue("a");
        assert.deepEqual(calls, [undefined, "a"]);
    });

    it("can remove entries", function () {
        const s = multiInput<string>();
        s.get("a").putValue("a");
        s.remove("a");
        assert.deepEqual(s.value, {});
    });

    it("removing a states also disconnects it", function () {
        const sm = multiInput<string>();
        const stateA = sm.get("a");
        stateA.putValue("a");
        assert.isTrue(stateA.isConnected());
        sm.remove("a");
        assert.isFalse(stateA.isConnected());
    });

    it("change events can be observed", function (done) {
        const sm = multiInput<string>();

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
        const sm = multiInput<string>();
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
