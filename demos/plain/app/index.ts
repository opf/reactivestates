import {Observable} from "rxjs";
import * as snabbdom from "snabbdom";
import {createNewContext} from "../../../src/Context";
import {ViewComponent, bootstrapView} from "../../../src/ViewComponent";
import {dependent} from "../../../src/DependentState";
import {state} from "../../../src/InputState";


const h = snabbdom.h;

class InnerStore extends ViewComponent {

    now = state(Date.now());

    protected render() {
        console.log("  inner render()");
        return h("div", [
            this.now.val,
            h("button", {on: {click: () => this.now.putValue(Date.now())}}, "inc"),
        ]);
    }

}

class CounterStore extends ViewComponent {

    counter = state(2);

    counter2 = dependent(this.counter, $ => $.map(v => v + 1000));

    invalidCounterErrorMsg = state<string>();

    innerComponent = this.context.create(InnerStore);

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
                "Counter: ", h("span", {style: {fontWeight: 'bold'}}, this.counter.val.toString()),
                " ",
                "Counter2: ", h("span", {style: {fontWeight: 'bold'}}, this.counter2.val.toString()),
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
bootstrapView(container!, ctx, CounterStore);


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
