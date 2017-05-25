// import {Observable, Subscription} from "rxjs";
// import * as snabbdom from "snabbdom";
// import sdClass from "snabbdom/modules/class";
// import sdEventListeners from "snabbdom/modules/eventlisteners";
// import sdProps from "snabbdom/modules/props";
// import sdStyle from "snabbdom/modules/style";
// import {thunk, Thunk} from "snabbdom/thunk";
// import {VNode} from "snabbdom/vnode";
// import {Component} from "./Component";
// import {Context, createChildContext} from "./Context";
// import {State} from "./State";
//
// const patch = snabbdom.init([
//     sdClass, sdProps, sdStyle, sdEventListeners
// ]);
//
// const h = snabbdom.h;
//
//
// export function bootstrapView<T extends ViewComponent>(element: Element,
//                                                        context: Context,
//                                                        Class: {new(context: Context): T}): T {
//
//     const component = context.create(Class);
//     let vnode: VNode|Element = element;
//
//     let updateRequested = false;
//     context.changed$.startWith(null).subscribe(() => {
//         if (!updateRequested) {
//             updateRequested = true;
//             setTimeout(() => {
//                 // console.log("renderView()");
//                 vnode = patch(vnode, component.getThunk());
//                 updateRequested = false;
//             }, 0);
//         }
//     });
//
//     return component;
// }
//
//
// export class ViewComponent extends Component {
//
//     protected domElementType = "div";
//
//     readonly storeSelector = this.domElementType + "#store-" + this.storeId;
//
//     readonly changed$: Observable<[string, State<any, any>]>;
//
//     protected context: Context;
//
//     protected _revision = 0;
//
//     private memberSubscriptions: Subscription[] = [];
//
//     constructor(parentContext: Context) {
//         super();
//         this.context = createChildContext(parentContext);
//         this.changed$ = this.context.changed$;
//         this.context.changed$.subscribe(() => {
//             this._revision++;
//         });
//     }
//
//     get revision() {
//         return this._revision;
//     }
//
//     onInit() {
//         this.memberSubscriptions.forEach(s => s.unsubscribe());
//         this.initializeMembers();
//
//         this.members!.forEach(member => {
//             this.memberSubscriptions.push(
//                     member.changes$().subscribe(() => {
//                         this.context.changed$.next([member.name, member]);
//                     })
//             );
//         });
//     }
//
//     getThunk(): Thunk {
//         return thunk(this.storeSelector, this.getView, [this._revision]);
//     }
//
//     protected render(): VNode {
//         return h("div");
//     };
//
//     private getView: () => VNode = () => {
//         return h(this.storeSelector, [this.render()]);
//     };
//
// }
