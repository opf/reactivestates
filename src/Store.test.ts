// import {Store} from "./Store";
// import {dependentState} from "./DependentState";
// import {Subject} from "rxjs";
//
// describe("Store", function () {
//
//     it("initializes state names", function () {
//         const dummy1 = new Subject<number>();
//
//         class S extends Store {
//             state1 = dependentState(dummy1);
//             state2 = dependentState(dummy1);
//         }
//
//         const s = new S();//.init();
//         assert.equal(s.state1.name, "state1");
//         assert.equal(s.state2.name, "state2");
//     });
//
//     it("connects states", function () {
//         const dummy1 = new Subject<number>();
//
//         class S extends Store {
//             state1 = dependentState(dummy1);
//         }
//
//         const s = new S().init();
//         assert.isTrue(s.state1.isConnected());
//     });
//
// });
