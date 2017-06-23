import * as _ from "lodash";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {isBrowser} from "./StoreLog";

const subscribeCallStacks = new Set<string>();

export function wrapObservableWithMemoryLeakDetection<T>(o: Observable<T>): Observable<T> {
    return Observable.create((subscriber: Observer<T>) => {
        let stack = new Error().stack;
        if (subscribeCallStacks.has(stack!)) {
            const msg = `Potential memory leak! Observable has duplicate subscriptions with the same stack trace!`;
            if (isBrowser()) {
                console.warn(msg, stack);
            } else {
                console.log(msg, stack);
            }
        }
        subscribeCallStacks.add(stack!);

        const sub = o.subscribe(
                val => {
                    subscriber.next(val);
                }, error => {
                    subscriber.error(error);
                }, () => {
                    subscriber.complete();
                }
        );

        return () => {
            subscribeCallStacks.delete(stack!);
            sub.unsubscribe();
        };
    });


}
