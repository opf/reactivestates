import * as snabbdom from "snabbdom";
import {thunk, Thunk} from "snabbdom/thunk";
import {VNode} from "snabbdom/vnode";
import sdClass from "snabbdom/modules/class";
import sdProps from "snabbdom/modules/props";
import sdStyle from "snabbdom/modules/style";
import sdEventListeners from "snabbdom/modules/eventlisteners";
import {Context} from "./Context";
import {Component} from "./Component";

const patch = snabbdom.init([
    sdClass, sdProps, sdStyle, sdEventListeners
]);

const h = snabbdom.h;


export function bootstrapView<T extends ViewComponent>(element: Element,
                                                       context: Context,
                                                       Class: {new(context: Context): T}): T {

    const component = context.create(Class);
    let vnode: VNode|Element = element;

    let updateRequested = false;
    context.changed$.startWith(null).subscribe(() => {
        if (!updateRequested) {
            updateRequested = true;
            setTimeout(() => {
                console.log("renderView()");
                vnode = patch(vnode, component.getThunk());
                updateRequested = false;
            }, 0);
        }
    });

    return component;
}


export class ViewComponent extends Component {

    readonly storeSelector = this.domElementType + "#store-" + this.storeId;

    protected domElementType = "div";

    getThunk(): Thunk {
        return thunk(this.storeSelector, this.getView, [this._revision]);
    }

    protected render(): VNode {
        return h("div");
    };

    private getView: () => VNode = () => {
        return h(this.storeSelector, [this.render()]);
    };

}
