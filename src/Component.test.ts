import {Component} from "./Component";
import {state} from "./InputState";
import {createNewContext} from "./Context";

describe("Component", function () {

    it("starts with revision 0, regardless of the number of states", function () {
        class Comp extends Component {
            //noinspection JSUnusedGlobalSymbols
            s1 = state<string>();

            //noinspection JSUnusedGlobalSymbols
            s2 = state<string>();
        }

        const ctx = createNewContext();
        const comp = ctx.create(Comp);
        assert.equal(comp.revision, 0);
    });

    it("changes its revision on state changes", function () {
        class Comp extends Component {
            s1 = state<string>();
        }

        const ctx = createNewContext();
        const comp = ctx.create(Comp);
        assert.equal(comp.revision, 0);
        comp.s1.putValue("b");
        assert.equal(comp.revision, 1);
        comp.s1.putValue("c");
        assert.equal(comp.revision, 2);
    });

    it("publishes state changes", function (done) {
        class Comp extends Component {
            s1 = state<string>();
        }

        const ctx = createNewContext();
        const comp = ctx.create(Comp);
        comp.changed$.subscribe(([name, s]) => {
            assert.equal(s, comp.s1);
            assert.equal(comp.s1.val, "a");
            done();
        });

        comp.s1.putValue("a");
    });

    it("can use nested objects to structure states", function (done) {
        class Comp extends Component {
            nestedA = {
                nestedB: {
                    s1: state<string>()
                }
            };
        }

        const ctx = createNewContext();
        const comp = ctx.create(Comp);
        comp.changed$.subscribe(([name, s]) => {
            assert.isTrue(name.indexOf(".nestedA.nestedB.s1") !== -1);
            assert.equal(s, comp.nestedA.nestedB.s1);
            assert.equal(comp.nestedA.nestedB.s1.val, "a");
            done();
        });

        comp.nestedA.nestedB.s1.putValue("a");
    });

});
