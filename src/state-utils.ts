import { map } from "rxjs/operators";
import { combine, CombinerState } from "./Combiner";
import { derive, DerivedState } from "./DerivedState";
import { State } from "./State";

export function If<IT, IX>(input: State<IT, IX>, ifLogic: (val: IT) => boolean): DerivedState<IT, IX, IT, undefined> {
    return derive(input, $ => $.pipe(map(v => ifLogic(v) ? v : undefined)));
}

export function IfThen<IT, IX, OT, OX>(input: State<IT, IX>, switchLogic: (val: IT) => boolean, then: State<OT, OX>): DerivedState<[IT, OT], undefined, OT, undefined> {
    const ifState: DerivedState<IT, IX, IT, undefined> = If(input, switchLogic);
    const both: CombinerState<[IT, OT], [undefined, OX]> = combine(ifState, then);
    return derive<[IT, OT], OT, any>(both, $ => $.pipe(map(([, out]) => out)));
}
