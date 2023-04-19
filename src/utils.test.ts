import {assert} from "chai";
import {input} from "./InputState";
import {State} from "./State";
import {IfThen} from "./state-utils";

describe("Utils", function () {

    it("IfThen", function () {
        // switch and value to process differently based on the switch
        const switchState = input<0 | 1 | 2>(0);
        const value = input("a");

        // 0. do noting
        // 1. path A
        // 2. path B
        const pathA: State<string> = IfThen(switchState, s => s === 1, value);
        const pathB: State<string> = IfThen(switchState, s => s === 2, value);
        pathA.changes$().subscribe();
        pathB.changes$().subscribe();

        // Test: switch = 0
        assert.isFalse(pathA.hasValue());
        assert.isFalse(pathB.hasValue());

        // Test: switch = 1
        switchState.putValue(1);
        assert.isTrue(pathA.hasValue());
        assert.isFalse(pathB.hasValue());

        // Test: switch = 2
        switchState.putValue(2);
        assert.isFalse(pathA.hasValue());
        assert.isTrue(pathB.hasValue());
    });

});
