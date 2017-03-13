import {trigger} from "./Trigger";
describe("Trigger", function () {

    it("does not call forEach after creation", function () {
        const t = trigger(() => {
            throw new Error("must not be called");
        });
    });

    it("calls forEach on trigger", function (done) {
        const t = trigger(() => {
            done();
        });

        t.trigger();
    });

    it("a trigger invocaton does not call subsequent sinks", function () {
        let counter = 0;

        const t = trigger(() => {
            counter += 1;
        });
        t.trigger();
        t.forEach(() => counter += 100);
        assert.equal(counter, 1);
        t.trigger();
        assert.equal(counter, 102);
    });


});
