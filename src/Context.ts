import {Subject} from "rxjs";
import {State} from "./State";

export interface Context {
    changed$: Subject<[string, State<any, any>]>;
    create: typeof create;
}

class ContextImpl implements Context {

    changed$ = new Subject<[string, State<any, any>]>();
    create = create;

}

export interface Injectable {
    onInit?: () => any;
}

export function create<T extends Injectable>(this: Context, Class: {new(context: Context): T}): T {
    let instance = new Class(this);

    if (instance.onInit) {
        instance.onInit();
    }

    return instance;
}

export function createNewContext(): Context {
    return new ContextImpl();
}

export function createChildContext(parent: Context): Context {
    const child = createNewContext();
    child.changed$.subscribe(s => {
        parent.changed$.next(s);
    });

    return child;
}
