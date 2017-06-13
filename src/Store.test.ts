import {MyStore, Store} from "./Store";

describe("Store", function () {

    it("", function () {

        const store = new MyStore();

        store.actionClear();

        store.select(
                "field1",
                "field3")
                .subscribe(x => {
                    console.log("client", x);
                    // console.log(store.data.field1);
                    // console.log(store.states.field1.value);
                });


        store.action1();

    });

});
