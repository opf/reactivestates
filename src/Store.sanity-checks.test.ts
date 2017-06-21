import {enableReactiveStatesLogging} from "./log";
import {enableDevelopmentMode, Store} from "./Store";

describe("Store - Sanity Checks", function () {

    beforeEach(function () {
        enableDevelopmentMode();
        enableReactiveStatesLogging(false);
    });

    it("this.data must not be modified between actions", function () {
        class S extends Store<{ field1: number }> {
            action1() {
                this.action("action", d => {
                    d.field1++;
                });
            }
        }
        const store = new S({field1: 0});
        assert.equal(store.data.field1, 0);
        store.action1();
        assert.equal(store.data.field1, 1);
        store.data.field1++;
        assert.throws(() => store.action1());
    });

    it("this.data must not be modified during an action", function () {
        class S extends Store<{ field1?: number }> {
            action1() {
                assert.equal(this.data.field1, 0);
                this.action("action1", data => {
                    data.field1 = 1;
                    this.data.field1 = 2;
                });
            }
        }
        const store = new S({field1: 0});
        assert.throws(() => store.action1());
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

    it("this.data must not be modified deeply", function () {
        class S extends Store<{ field1: number[] }> {
            action1() {
                this.action("action", () => {
                    this.data.field1.push(1);
                });
            }
        }
        const store = new S({field1: []});
        assert.throws(() => store.action1());
    });

    it.skip("this.data (with deepCloneFields enabled) must not be modified deeply", function () {
        class S extends Store<{ field1: number[] }> {
            action1() {
                this.action("action", (d) => {
                    this.data.field1.push(1);
                    console.log(d);
                }, {
                    deepCloneFields: ["field1"]
                });
            }
        }
        const store = new S({field1: []});
        assert.throws(() => store.action1());
    });

});
