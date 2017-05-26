import {derive, deriveRaw} from "./DerivedState";
import {input} from "./InputState";
import {StatesGroup} from "./StatesGroup";

describe("log", function () {

    it("log on state change", function () {
        class States extends StatesGroup {
            name = "group1";
            input$ = input<number>(1);
            state2 = derive(this.input$, $ => $.map(v => v + 1000));
        }

        const states = new States();
        states.enableLog(true);

        states.state2.changes$().subscribe();

        states.input$.putValue(2);
        states.input$.putValue(undefined);
        states.input$.putValue(3);

    });

});
