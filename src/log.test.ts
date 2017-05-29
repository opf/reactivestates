import {derive} from "./DerivedState";
import {input} from "./InputState";
import {setLogger} from "./log";
import {StatesGroup} from "./StatesGroup";

describe("log", function () {

    it("log on state change", function () {
        setLogger(() => {
        });

        class States extends StatesGroup {
            name = "group1";
            input$ = input<number>();
            state2 = derive(this.input$, $ => $.map(v => v + 1000));
        }

        const states = new States();
        states.enableLog(true);
        states.state2.changes$().subscribe();

        let logged = "";
        setLogger(msg => {
            logged += msg;
        });

        states.input$.putValue(1);

        assert.include(logged, "group1.input$");
        assert.include(logged, "= 1");
        assert.include(logged, "group1.state2");
        assert.include(logged, "= 1001");
    });

});
