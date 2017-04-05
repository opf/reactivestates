import {Observable, Observer} from "rxjs";
import * as snabbdom from "snabbdom";
import {combine} from "../../../src/Combiner";
import {createNewContext} from "../../../src/Context";
import {dependent} from "../../../src/DependentState";
import {input} from "../../../src/InputState";
import {bootstrapView, ViewComponent} from "../../../src/ViewComponent";
import {gateFor} from "../../../src/Gate";

const h = snabbdom.h;

class InnerComponent extends ViewComponent {

    now = input(Date.now());

    protected render() {
        // console.log("  inner render()");
        return h("div", [
            this.now.value,
            h("button", {on: {click: () => this.now.putValue(Date.now())}}, "inc"),
        ]);
    }

}

class CounterComponent extends ViewComponent {

    name = "CounterComp";

    counterIn = input(0);

    counterIsValid = dependent(this.counterIn, $ =>
            $.map(v => v >= 0));

    counter = dependent(combine(this.counterIsValid, this.counterIn), $ => $
            .filter(([valid]) => valid)
            .map(([valid, counter]) => counter));

    doLoad = gateFor(this.counter);

    counter2 = dependent(this.doLoad, $ =>
            $.switchMap(v => {
                return Observable.create((obs: Observer<Number>) => {
                    setTimeout(() => {
                        obs.next(v + 1000);
                        obs.complete();
                    }, 1000);
                });
            }));

    innerComponent = this.context.create(InnerComponent);


    changeCounter(offset: number) {
        const current = this.counter.getValueOr(0);
        this.counterIn.putValue(current + offset);
    }

    render() {
        // console.log("  outer render()");

        return h("div.counter", [
            h("div", [
                "Counter: ", h("span", {style: {fontWeight: "bold"}}, this.counter.valueString),
                " ",
                "Counter2: ", h("span", {style: {fontWeight: "bold"}}, this.counter2.valueString),
                " ",
                this.counterIsValid.value ? h("span") : h("span", "invalid"),
            ]),
            h("div", [
                h("button", {on: {click: () => this.changeCounter(-1)}}, "-1"),
                " ",
                h("button", {on: {click: () => this.changeCounter(1)}}, "+1")
            ]),
            h("hr"),
            h("div", this.innerComponent.getThunk())
        ]);
    }
}

const container = document.getElementById("container");
const ctx = createNewContext();
let root = bootstrapView(container!, ctx, CounterComponent);
root.enableLog(true);
