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

    it("access to this.data is isolated inside an action", function (done) {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action("action1", data => {
                    data.field1 = 1;
                    assert.equal(this.data.field1, 0);
                    assert.equal(data.field1, 1);
                    done();
                });
            }
        }
        const store = new S({field1: 0});
        store.action1();
    });

    it("nested actions can see dirty outer changes", function (done) {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action("outer", data => {
                    data.field1 = 1;
                    this.action("inner", data => {
                        assert.equal(data.field1, 1);
                        done();
                    });
                });
            }
        }
        const store = new S({field1: 0});
        store.action1();
    });

    it("changes done by nested actions will afterwards be visible in outer actions", function (done) {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action("outer", data => {
                    data.field1 = 1;
                    assert.equal(data.field1, 1);
                    this.action("inner", data => {
                        assert.equal(data.field1, 1);
                        data.field1 = 2;
                        assert.equal(data.field1, 2);
                    });
                    assert.equal(data.field1, 2);
                    done();
                });
            }
        }
        const store = new S({field1: 0});
        store.action1();
    });

    it("nested actions can be asynchronous", function (done) {
        const calls: any[] = [];
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action("outer", data => {
                    // start inner asynchronous action
                    setTimeout(() => {
                        // alter data in inner action
                        this.action("inner", data => {
                            data.field1 = 2;
                        }, {
                            afterAction: () => {
                                assert.deepEqual(calls, [0, 1, 2]);
                                done();
                            }
                        });
                    }, 0);

                    // alter data in outer action
                    data.field1 = 1;
                });
            }
        }
        const store = new S({field1: 0});
        store.select("field1").subscribe(s => calls.push(s.data.field1));
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

    it("actions must not modify nested fields", function (done) {
        class S extends Store<{ field1: number[] }> {
            action1() {
                this.action("action", data => {
                    data.field1.push(1);
                });
            }
        }
        const store = new S({field1: []});
        try {
            store.action1();
        } catch (e) {
            done();
        }
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
        store.action1();
    });

    it("action option - deepCloneFields correctly identifies changed fields", function (done) {
        class S extends Store<{ field1?: number[], field2: number[], field3: number[] }> {
            action1() {
                this.action("action", data => {
                    data.field3.push(1);
                }, {
                    deepCloneFields: ["field1", "field2", "field3"],
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

    it("select() emits values initially", function (done) {
        class S extends Store<{ field1: number[] }> {
        }
        const store = new S({field1: []});
        store.select("field1")
                .subscribe(() => done());
    });

    it("select() emits values whenever a selected field changes", function () {
        class S extends Store<{ field1: number }> {
            action1() {
                this.action("change field", data => {
                    data.field1 = 1;
                })
            }
        }
        const calls: any[] = [];
        const store = new S({field1: 0});
        store.select("field1")
                .subscribe(() => calls.push(store.data.field1));
        store.action1();
        assert.deepEqual(calls, [0, 1]);
    });

    it("select() doesn't emit values when a non-selected field changes", function () {
        class S extends Store<{ field1: number, field2: number }> {
            action1() {
                this.action("change field", data => {
                    data.field1 = 1;
                })
            }
        }
        const calls: any[] = [];
        const store = new S({field1: 0, field2: 5});
        store.select("field2")
                .subscribe(() => calls.push(store.data.field2));
        store.action1();
        assert.deepEqual(calls, [5]);
    });

    it("select() - allSelectedFieldsNonNil return true if all selected fields are nonNil", function () {
        class S extends Store<{ field1: number | null }> {
            action1() {
                this.action("change field", data => {
                    data.field1 = 1;
                })
            }
        }
        const calls: any[] = [];
        const store = new S({field1: null});
        store.select("field1")
                .subscribe(s => calls.push(s.allSelectedFieldsNonNil()));
        store.action1();
        assert.deepEqual(calls, [false, true]);
    });

    it("selectNonNil() emits a value if all selected fields are already nonNil", function (done) {
        class S extends Store<{ field1: number }> {
        }
        const store = new S({field1: 0});
        store.selectNonNil("field1")
                .subscribe(s => done());
    });

    it("selectNonNil() emits a value once all selected fields are nonNil", function (done) {
        class S extends Store<{ field1: number | null}> {
            action1() {
                this.action("load field1", d => {
                    d.field1 = 1;
                });
            }
        }
        const store = new S({field1: null});
        store.selectNonNil("field1")
                .subscribe(s => done());
        store.action1();
    });

});
