import {enableReactiveStatesLogging} from "./log";
import {enableDevelopmentMode, Store} from "./Store";

describe("Store - Sanity Checks", function () {

    beforeEach(function () {
        enableDevelopmentMode();
        enableReactiveStatesLogging(false);
    });

    it("this.data must not be modified", function () {
        class S extends Store<{ field1: number }> {
            action1() {
                this.action("action1", d => {
                    d.field1++;
                    this.action2();
                });
            }

            action2() {
                this.action("action2", d => {
                    d.field1++;
                });
            }
        }
        const store = new S({field1: 0});
        store.action1();
        store.action1();

        assert.throws(
                () => (store.state as any).field1++,
                "invalid attempt to mutate this.data");
    });

    it("this.data must not be modified deeply between actions", function () {
        class S extends Store<{ field1: number[] }> {
            action1() {
                this.action("action1", () => {
                    this.action2();
                });
            }

            action2() {
                this.action("action2", () => {
                });
            }
        }
        const store = new S({field1: []});
        store.action1();
        store.action1();
        store.state.field1.push(1);
        assert.throws(
                () => store.state,
                "invalid attempt to mutate this.data");
    });

    it("this.data must not be modified during an action", function () {
        class S extends Store<{ field1?: number }> {
            action1() {
                assert.equal(this.state.field1, 0);
                this.action("action1", data => {
                    data.field1 = 1;
                    (this.state as any).field1 = 1;
                });
            }
        }
        const store = new S({field1: 0});
        assert.throws(
                () => store.action1(),
                "invalid attempt to mutate this.data");
    });

    it("local data must not be modified deeply", function () {
        class S extends Store<{ field1: number[] }> {
            action1() {
                this.action("action", data => {
                    data.field1.push(1);
                });
            }
        }
        const store = new S({field1: []});
        assert.throws(() => store.action1());
    });

    it("this.data must not be modified deeply during an action", function () {
        class S extends Store<{ field1: number[] }> {
            action1() {
                this.action("action", () => {
                    this.state.field1.push(1);
                });
            }
        }
        const store = new S({field1: []});
        assert.throws(
                () => store.action1(),
                "invalid attempt to mutate this.data");
    });

    it("this.data (with deepCloneFields enabled) must not be modified deeply", function () {
        class S extends Store<{ field1: number[] }> {
            action1() {
                this.action("action", () => {
                    this.state.field1.push(1);
                }, {
                    deepCloneFields: ["field1"]
                });
            }
        }
        const store = new S({field1: []});
        assert.throws(
                () => store.action1(),
                "invalid attempt to mutate this.data");
    });

});
