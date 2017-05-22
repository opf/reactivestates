import {input} from "./InputState";
import {replayable} from "./ReplayableState";

describe("ReplayableState", function () {

    it("can be used with InputState", function () {
        const calls: any[] = [];
        const replayable$ = replayable(input(1));
        replayable$.changes$().subscribe(v => calls.push(v));

        replayable$.putValue(2);
        replayable$.replay();

        assert.deepEqual(calls, [1, 2, 2])
    });

});
