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
        const s = stateMap(() => state<string>());
        s.get("a").putValue("a");
        assert.isTrue(s.isConnected());
        s.remove("a");
        assert.isFalse(s.isConnected());
    });

});
