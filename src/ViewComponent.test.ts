import {createNewContext} from "./Context";
import {input} from "./InputState";
import {ViewComponent} from "./ViewComponent";

describe("ViewComponent", function () {

    it("starts with a revision count, that matches the number of states", function () {
        class Comp extends ViewComponent {
            //noinspection JSUnusedGlobalSymbols
            s1 = input<string>();

            //noinspection JSUnusedGlobalSymbols
            s2 = input<string>();
        }

        const ctx = createNewContext();
        const comp = ctx.create(Comp);
        comp.enableLog(true);
        assert.equal(comp.revision, 2);
    });

    it("changes its revision on state changes", function () {
        class Comp extends ViewComponent {
            s1 = input<string>();
            s2 = input<string>();
        }

        const ctx = createNewContext();
        const comp = ctx.create(Comp);
        assert.equal(comp.revision, 2);
        comp.s1.putValue("b");
        assert.equal(comp.revision, 3);
        comp.s1.putValue("c");
        assert.equal(comp.revision, 4);
        comp.s2.putValue("d");
        assert.equal(comp.revision, 5);
    });

    it("publishes state changes", function (done) {
        class Comp extends ViewComponent {
            s1 = input<string>();
        }

        const ctx = createNewContext();
        const comp = ctx.create(Comp);
        comp.changed$.subscribe(([name, s]) => {
            assert.equal(s, comp.s1);
            assert.equal(comp.s1.value, "a");
            done();
        });

        comp.s1.putValue("a");
    });

    it("can use nested objects to structure states", function (done) {
        class Comp extends ViewComponent {
            nestedA = {
                nestedB: {
                    s1: input<string>()
                }
            };
        }

        const ctx = createNewContext();
        const comp = ctx.create(Comp);
        comp.changed$.subscribe(([name, s]) => {
            assert.isTrue(name.indexOf(".nestedA.nestedB.s1") !== -1);
            assert.equal(s, comp.nestedA.nestedB.s1);
            assert.equal(comp.nestedA.nestedB.s1.value, "a");
            done();
        });

        comp.nestedA.nestedB.s1.putValue("a");
    });

});
