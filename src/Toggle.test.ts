import {toggle} from "./Toggle";

describe("Toggle", function () {

    it("starts with the default initial state 'false'", function (done) {
        const t = toggle();
        t.observeValues()
                .subscribe(v => {
                    assert.isFalse(v);
                    done();
                });
    });

    it("starts with the specified initial state", function (done) {
        const t = toggle(true);
        t.observeValues()
                .subscribe(v => {
                    assert.isTrue(v);
                    done();
                });
    });

    it("can toggle the state", function (done) {
        const t = toggle();
        t.toggle();
        
        t.observeValues()
                .subscribe(v => {
                    assert.isTrue(v);
                    done();
                });
    });

});
