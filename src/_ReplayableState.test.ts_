import {input} from "./InputState";
import {replayable} from "./ReplayableState";

describe("ReplayableState", function () {

    it("can be used with InputState", function () {
        const calls: any[] = [];
        let input$ = input(1);
        const replayable$ = replayable(input$);
        replayable$.changes$().subscribe(v => calls.push(v));

        input$.putValue(2);
        replayable$.replay();

        assert.deepEqual(calls, [1, 2, 2]);
    });

});
