import {enableReactiveStatesLogging} from "./log";
import {ActionOptions, enableDevelopmentMode, Store} from "./Store";

describe("Store", function () {

    beforeEach(function () {
        enableDevelopmentMode();
        enableReactiveStatesLogging(false);
    });

    it("an action can create a new field", function () {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action("action1", data => {
                    data.field1 = 1;
                });
            }
        }
        const store = new S({});
        store.action1();
        assert.equal(store.data.field1, 1);
    });

    it("an action can change a field", function () {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action("action1", data => {
                    data.field1 = 1;
                });
            }
        }
        const store = new S({field1: 0});
        assert.equal(store.data.field1, 0);
        store.action1();
        assert.equal(store.data.field1, 1);
    });

    it("an action can set a field to undefined", function () {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action("action1", data => {
                    data.field1 = undefined;
                });
            }
        }
        const store = new S({field1: 1});
        store.action1();
        assert.isUndefined(store.data.field1);
    });

    it("data can be changed by subsequent actions", function () {
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
        store.action1();
        assert.equal(store.data.field1, 2);
    });

    it("action option - deepCloneFields", function () {
        class S extends Store<{ field1: number[] }> {
            action1() {
                this.action("action", data => {
                    data.field1.push(1);
                }, {deepCloneFields: ["field1"]});
            }
        }
        const store = new S({field1: []});
        const calls: any[] = [];
        store.select("field1").subscribe(s => calls.push(s.data.field1));
        store.action1();
        assert.deepEqual(calls, [
           [],
           [1],
        ]);
    });

    it("action option - deepCloneFields correctly identifies changed fields", function (done) {
        class S extends Store<{ field1?: number[], field2: number[], field3: number[] }> {
            action1() {
                this.action("action", data => {
                    data.field3.push(1);
                }, {
                    deepCloneFields: ["field2", "field3"],
                    afterAction: (store, data, modifiedFields, newFields) => {
                        assert.isFalse(modifiedFields.has("field1"));
                        assert.isFalse(newFields.has("field1"));
                        assert.isFalse(modifiedFields.has("field2"));
                        assert.isFalse(newFields.has("field2"));
                        assert.isTrue(modifiedFields.has("field3"));
                        assert.isFalse(newFields.has("field3"));
                        done();
                    }
                });
            }
        }
        const store = new S({field2: [], field3: []});
        store.action1();
    });

    it("exceptions during an action rollback all changes", function () {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action("action1", data => {
                    data.field1 = 1;
                    throw new Error();
                });
            }
        }
        const store = new S({field1: 0});
        assert.throws(() => store.action1());
        assert.equal(store.data.field1, 0);
    });

    it("changes from actions are visible inside nested actions via action data param and this.data", function () {
        class S extends Store<{ field1: number, field2?: string, field3: number[]}> {
            action1() {
                this.action("a1", d1 => {
                    d1.field1 = 1;
                    d1.field2 = "a";

                    assert.equal(this.data.field1, 1);
                    assert.equal(this.data.field2, "a");

                    this.action("a2", d2 => {
                        assert.equal(d2.field1, 1);
                        assert.equal(d2.field2, "a");
                        assert.equal(this.data.field1, 1);
                        assert.equal(this.data.field2, "a");

                        d2.field1 = 2;
                        d2.field2 = "b";
                        d2.field3.push(99);

                        assert.equal(this.data.field1, 2);
                        assert.equal(this.data.field2, "b");
                        assert.deepEqual(this.data.field3, [99]);

                        this.action("a3", d3 => {
                            assert.equal(d3.field1, 2);
                            assert.equal(d3.field2, "b");
                            assert.deepEqual(d3.field3, [99]);
                            assert.equal(this.data.field1, 2);
                            assert.equal(this.data.field2, "b");
                            assert.deepEqual(this.data.field3, [99]);
                        });
                    }, {
                        deepCloneFields: ["field3"]
                    });

                    assert.equal(d1.field1, 2);
                    assert.equal(d1.field2, "b");
                    assert.deepEqual(d1.field3, [99]);
                    assert.equal(this.data.field1, 2);
                    assert.equal(this.data.field2, "b");
                    assert.deepEqual(this.data.field3, [99]);
                });

                assert.equal(this.data.field1, 2);
                assert.equal(this.data.field2, "b");
            }
        }
        const store = new S({field1: 0, field3: []});
        store.action1();
    });

    it("defaultActionOptions are used", function (done) {
        class S extends Store<{}> {

            protected defaultActionOptions(): ActionOptions<{}> {
                return {
                    afterAction: () => {
                        done();
                    }
                };
            }

            action1() {
                this.action("action1", () => {
                });
            }
        }
        const store = new S({});
        store.action1();
    });

    it("action options override the defaultActionOptions", function (done) {
        class S extends Store<{}> {

            protected defaultActionOptions(): ActionOptions<{}> {
                return {
                    afterAction: () => {
                        throw new Error();
                    }
                };
            }

            action1() {
                this.action("action1", () => {
                }, {
                    afterAction: () => {
                        done();
                    }
                });
            }
        }
        const store = new S({});
        store.action1();
    });

    it("callback afterAction", function (done) {
        class S extends Store<{ field1?: number, field2?: number }> {
            action1() {
                this.action("action1", data => {
                    data.field1 = 1;
                    data.field2 = 5;
                }, {
                    afterAction: (store, data, changedFields, newFields) => {
                        assert.equal(data.field1, 1);
                        assert.equal(data.field2, 5);
                        assert.deepEqual(Array.from(changedFields), ["field1"]);
                        assert.deepEqual(Array.from(newFields), ["field2"]);
                        done();
                    }
                });
            }
        }
        const store = new S({field1: 0});
        store.action1();
    });

});
