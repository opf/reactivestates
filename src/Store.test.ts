import {Store} from "./Store";
import {enableReactiveStatesLogging} from "./log";

describe("Store", function () {

    it("an action can create a new field", function () {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action(data => {
                    data.field1 = 1;
                });
            }
        }
        const store = new S({});
        const calls: any[] = [];
        store.select("field1").subscribe(s => calls.push(s.data.field1));
        store.action1();
        assert.equal(store.data.field1, 1);
        assert.deepEqual(calls, [1]);
    });

    it("an action can change a field", function () {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action(data => {
                    data.field1 = 1;
                });
            }
        }
        const store = new S({field1: 0});
        assert.equal(store.data.field1, 0);
        const calls: any[] = [];
        store.select("field1").subscribe(s => calls.push(s.data.field1));
        store.action1();
        assert.equal(store.data.field1, 1);
        assert.deepEqual(calls, [0, 1]);
    });

    it("an action can set a field to undefined", function () {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action(data => {
                    data.field1 = undefined;
                });
            }
        }
        const store = new S({field1: 1});
        const calls: any[] = [];
        store.select("field1").subscribe(s => calls.push(s.data.field1));
        store.action1();
        assert.isUndefined(store.data.field1);
        assert.deepEqual(calls, [1, undefined]);
    });

    it("access to this.data is isolated inside an action", function (done) {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action(data => {
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
                this.action(data => {
                    data.field1 = 1;
                    this.action(data => {
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
                this.action(data => {
                    data.field1 = 1;
                    assert.equal(data.field1, 1);
                    this.action(data => {
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
        enableReactiveStatesLogging();
        const calls: any[] = [];
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action(data => {
                    // start inner asynchronous action
                    setTimeout(() => {
                        // alter data in inner action
                        this.action(data => {
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
                }, {name: "outer"});
            }
        }
        const store = new S({field1: 0});
        store.select("field1").subscribe(s => calls.push(s.data.field1));
        store.action1();
    });


    it("callback afterAction", function (done) {
        class S extends Store<{ field1?: number, field2?: number }> {
            action1() {
                this.action(data => {
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
