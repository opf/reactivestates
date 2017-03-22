import {Observable} from "rxjs";
import * as _ from "lodash";
import {Context, createChildContext, Injectable} from "./Context";
import {State} from "./State";


export class Component implements Injectable {

    protected static nextStoreId = 0;

    loggingFn = (msg: string) => {
        console.error(msg);
    };

    readonly storeId = Component.nextStoreId++;

    readonly changed$: Observable<[string, State<any>]>;

    protected context: Context;

    protected _revision = 0;

    private callDepth = 1;

    constructor(parentContext: Context) {
        this.context = createChildContext(parentContext);
        this.changed$ = this.context.changed$;
        this.context.changed$.subscribe(() => {
            this._revision++;
        });
    }

    get revision() {
        return this._revision;
    }

    onInit() {
        this.handleAndTraverseProperty("", this);
        this._revision = 0;
        return this;
    }

    private handleAndTraverseProperty(path: string, obj: any) {
        for (const propertyName in obj) {
            if (obj.hasOwnProperty(propertyName)) {
                const member = obj[propertyName];

                if (member instanceof State) {
                    member.name = this.storeId + path + "." + propertyName;

                    member.stateSetWrapper = (fn: () => any) => {
                        this.loggingFn(Array(this.callDepth).join("  ") + "[" + member.name + "] changed");

                        this.callDepth++;
                        fn();
                        this.callDepth--;
                    };

                    member.observeAll()
                            .subscribe(() => {
                                this.context.changed$.next([this.storeId + path + "." + propertyName, member]);
                            });
                }

                else if (_.isPlainObject(member)) {
                    this.handleAndTraverseProperty(path + "." + propertyName, member);
                }

            }
        }

    }

}
