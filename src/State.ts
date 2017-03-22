import {Observable} from "rxjs";

let unnamedStateCounter = 0;

export abstract class State<T> {

    public name = "unnamed-" + unnamedStateCounter++;

    public abstract connect(): this;

    public abstract disconnect(): this;

    public abstract isConnected(): boolean;

    public abstract observeAll(): Observable<T|undefined>;

    public abstract observeValues(): Observable<T>;

    public abstract observeNonValues(): Observable<T|undefined>;

    stateSetWrapper = (fn: () => any) => {
        fn();
    };

    protected log(msg: string) {
        console.debug(msg);
    }

}
