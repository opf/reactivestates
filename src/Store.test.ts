import {Store} from "./Store";


describe("Store", function () {

    it("an action can create a new field", function () {
        class S extends Store<{ field1?: number }> {
            action1() {
                this.action("action1", data => {
                    data.field1 = 1;
                });
            }
        }
        const store = new S({});
        const calls: any[] = [];
        store.select("field1").subscribe(s => calls.push(s));
        store.action1();
        assert.equal(store.data.field1, 1);
        assert.deepEqual(calls, [{data: {field1: 1}, fields: ["field1"]}]);
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
        const calls: any[] = [];
        store.select("field1").subscribe(s => calls.push(s));
        store.action1();
        assert.equal(store.data.field1, 1);
        assert.deepEqual(calls, [
            {data: {field1: 0}, fields: ["field1"]},
            {data: {field1: 1}, fields: ["field1"]}
        ]);
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
        const calls: any[] = [];
        store.select("field1").subscribe(s => calls.push(s));
        store.action1();
        assert.isUndefined(store.data.field1);
        assert.deepEqual(calls, [
            {data: {field1: 1}, fields: ["field1"]},
            {data: {field1: undefined}, fields: ["field1"]}
        ]);
    });

});
