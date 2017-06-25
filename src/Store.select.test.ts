import * as _ from "lodash";
import {enableReactiveStatesLogging} from "./log";
import {enableDevelopmentMode, enableMemoryLeakDetection, Store} from "./Store";

describe("Store - select", function () {

    beforeEach(function () {
        enableDevelopmentMode();
        enableReactiveStatesLogging(false);
    });

    it("changes from nested action are pushed to select-streams", function () {
        class S extends Store<{ field1: number, field2?: string }> {
            action1() {
                this.action("a1", d1 => {
                    d1.field1 = 1;
                    d1.field2 = "a";
                    this.action("a2", d2 => {
                        d2.field1 = 2;
                        d2.field2 = "b";
                        this.action("a3", d2 => {
                            d2.field1 = 3;
                            d2.field2 = "c";
                        });
                    });
                    d1.field2 = "aa";
                });
            }
        }
        const store = new S({field1: 0});
        const calls: any[] = [];
        store.select("field1", "field2")
                .subscribe(s => {
                    calls.push([s.state.field1, s.state.field2]);
                });
        store.action1();

        assert.deepEqual(calls, [
            [0, undefined],
            [3, "aa"]
        ]);
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
                });
            }
        }
        const calls: any[] = [];
        const store = new S({field1: 0});
        store.select("field1")
                .subscribe(() => calls.push(store.state.field1));
        store.action1();
        assert.deepEqual(calls, [0, 1]);
    });

    it("select() doesn't emit values when a non-selected field changes", function () {
        class S extends Store<{ field1: number, field2: number }> {
            action1() {
                this.action("change field", data => {
                    data.field1 = 1;
                });
            }
        }
        const calls: any[] = [];
        const store = new S({field1: 0, field2: 5});
        store.select("field2")
                .subscribe(() => calls.push(store.state.field2));
        store.action1();
        assert.deepEqual(calls, [5]);
    });

    it("select() - allSelectedFieldsNonNil return true if all selected fields are nonNil", function () {
        class S extends Store<{ field1: number | null }> {
            action1() {
                this.action("change field", data => {
                    data.field1 = 1;
                });
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
        class S extends Store<{ field1: number | null }> {
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

    it("detect memory leak subscriptions", function (done) {
        enableMemoryLeakDetection();

        console.log = (...msg: any[]) => {
            assert.include(msg.join(""), "leak");
            done();
        };

        class S extends Store<{ field1: number }> {
        }
        const store = new S({field1: 1});

        function subscribe() {
            store.selectNonNil("field1").subscribe();
        }

        _.times(2, () => subscribe());
    });

});
