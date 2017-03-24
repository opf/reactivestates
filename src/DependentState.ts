import {Observable} from "rxjs";
import {State} from "./State";

export class DependentState<I, T> extends State<T> {

    private readonly sourceState$: State<I>;

    constructor(source: State<I>,
                transformer: ($: Observable<I>) => Observable<T>) {

        const values$ = transformer(source.values$());
        const nonValues$ = source.nonValues$();
        const source$ = Observable.merge(nonValues$, values$);

        super(source$);
        this.sourceState$ = source;
    }

}


export function dependent<I, T>(state: State<I>,
                                transformer: ($: Observable<I>) => Observable<T>): DependentState<I, T> {

    return new DependentState(state, transformer);
}
