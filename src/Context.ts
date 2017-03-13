import {State} from "./Component";
import {Subject} from "rxjs";

export interface Context {
    changed$: Subject<State<any>>;
    create: typeof create;
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
    return {
        changed$: new Subject<State<any>>(),
        create: create
    };
}

export function createChildContext(parent: Context): Context {
    const child = createNewContext();
    child.changed$.subscribe(s => {
        parent.changed$.next(s);
    });

    return child;
}
