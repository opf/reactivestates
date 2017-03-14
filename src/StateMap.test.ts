import {state} from "./InputState";
import {stateMap} from "./StateMap";

describe("StateMap", function () {

    it("is empty after creation", function () {
        const s = stateMap(() => state<string>());
        assert.deepEqual(s.val, {});
    });

    it("fills previously requested states", function (done) {
        const s = stateMap(() => state<string>());
        let stateA = s.get("a");
        stateA.observeValues().subscribe(val => {
            assert.equal(val, "a");
            done();
        });
        stateA.putValue("a");
    });

    it("can remove entries", function () {
        const s = stateMap(() => state<string>());
        s.get("a").putValue("a");
        s.remove("a");
        assert.deepEqual(s.val, {});
    });

    it("removing a states also disconnects it", function () {
        const sm = stateMap(() => state<string>());
        const stateA = sm.get("a");
        stateA.putValue("a");
        assert.isTrue(stateA.isConnected());
        sm.remove("a");
        assert.isFalse(stateA.isConnected());
    });

    it("change events can be observed", function (done) {
        const sm = stateMap(() => state<string>());

        let callCount = 0;
        sm.observeChange().subscribe(([key, val, state]) => {
            if (callCount === 0) {
                assert.isUndefined(val);
            } else {
                assert.equal(key, "a");
                assert.equal(val, "a");
                assert.equal(state.val, "a");
                done();
            }
            callCount++;
        });

        sm.get("a").putValue("a");
    });

    it("remove events can be observed", function (done) {
        const sm = stateMap(() => state<string>());
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
