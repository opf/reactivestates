import {Observable, Observer} from "rxjs";
import * as snabbdom from "snabbdom";
import {createNewContext} from "../../../src/Context";
import {ViewComponent, bootstrapView} from "../../../src/ViewComponent";
import {dependent} from "../../../src/DependentState";
import {input} from "../../../src/InputState";
import {combine} from "../../../src/Combiner";


const h = snabbdom.h;

class InnerComponent extends ViewComponent {

    now = input(Date.now());

    protected render() {
        console.log("  inner render()");
        return h("div", [
            this.now.value,
            h("button", {on: {click: () => this.now.putValue(Date.now())}}, "inc"),
        ]);
    }

}

class CounterComponent extends ViewComponent {

    name = "CounterComp";

    counter = input(2);

    counter2 = dependent(this.counter, $ => $.flatMap(v => {
        return Observable.create((obs: Observer<Number>) => {
            setTimeout(() => {
                obs.next(v + 1000);
                obs.complete();
            }, 1000);
        });
    }));

    invalidCounterErrorMsg = input<string>();

    innerComponent = this.context.create(InnerComponent);

    changeCounter(offset: number) {
        this.counter.doModify(val => {
            const newVal = val + offset;
            if (newVal >= 0) {
                this.invalidCounterErrorMsg.clear();
                return newVal;
            } else {
                this.invalidCounterErrorMsg.putValue("invalid: " + newVal);
                return Observable.never();
            }
        });
    }

    render() {
        console.log("  outer render()");

        return h('div.counter', [
            h("div", [
                "Counter: ", h("span", {style: {fontWeight: 'bold'}}, this.counter.valueString),
                " ",
                "Counter2: ", h("span", {style: {fontWeight: 'bold'}}, this.counter2.valueString),
                " ",
                this.invalidCounterErrorMsg.hasValue() ? h("span", "error") : null,
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


//////////////////////
// console.log("----------------------------------------------------------------");
//
// type Partial<T> = { [P in keyof T]?: T[P]; };
// type Proxy<T> = Partial<T> & {target: T};
//
// function createProxy<A, B extends Proxy<A>>(target: A, proxy: B): A {
//     proxy.target = target;
//     (proxy as any).__proto__.__proto__ = target;
//     return proxy as any;
// }
//
//
// class Service {
//     methodA() {
//         console.log("a");
//     }
//
//     methodB() {
//         console.log("b");
//     }
//
//     methodC() {
//         console.log("c");
//     }
// }
//
// class MyProxy {
//
//     target: Service;
//
//     methodB() {
//         console.log(">>>");
//         this.target.methodB();
//         console.log("<<<");
//     }
//
// }
//
// const s = new Service();
// const p = new MyProxy();
//
// const proxy = createProxy(s, p);
// proxy.methodB();
//
// console.log("----------------------------------------------------------------");
