import {Observable} from "rxjs";
import {Context, createChildContext, Injectable} from "./Context";

export abstract class State<T> {

    public abstract connect(): this;

    public abstract disconnect(): this;

    public abstract isConnected(): boolean;

    public abstract observeAll(): Observable<T|undefined>;

    public abstract observeValues(): Observable<T>;

    public abstract observeNonValues(): Observable<T|undefined>;

    stateSetWrapper = (fn: () => any) => {
        fn();
    };

}

export class Component implements Injectable {

    protected static nextStoreId = 0;

    readonly storeId = Component.nextStoreId++;

    readonly changed$: Observable<State<any>>;

    protected context: Context;

    protected _revision = 0;

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
        let callDepth = 1;
        for (const propertyName in this) {
            if (this.hasOwnProperty(propertyName)) {
                const member = this[propertyName];
                if (member instanceof State) {

                    member.stateSetWrapper = (fn: () => any) => {
                        console.log(Array(callDepth).join("  ") + "[" + this.storeId + "-" + propertyName + "] changed");
                        callDepth++;
                        fn();
                        callDepth--;
                    };

                    member.observeAll()
                            .subscribe(() => {
                                this.context.changed$.next(member);
                            });
                }
            }
        }
        this._revision = 0;
        return this;
    }

}
