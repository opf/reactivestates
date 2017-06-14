import {derive} from "./DerivedState";
import {input} from "./InputState";
import {enableReactiveStatesLogging, setLogger} from "./log";
import {StatesGroup} from "./StatesGroup";

describe("log", function () {

    it("log on state change", function () {
        enableReactiveStatesLogging();

        setLogger(() => {
        });

        class States extends StatesGroup {
            name = "group1";
            input$ = input<number>();
            state2 = derive(this.input$, $ => $.map(v => v + 1000));

            constructor() {
                super();
                this.initializeMembers();
            }
        }

        const states = new States();
        states.state2.changes$().subscribe();

        let logged = "";
        setLogger(state => {
            logged += state.name + "=" + state.value;
        });

        states.input$.putValue(1);

        assert.include(logged, "group1.input$");
        assert.include(logged, "=1");
        assert.include(logged, "group1.state2");
        assert.include(logged, "=1001");
    });

});
