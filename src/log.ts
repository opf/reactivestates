import {State} from "./State";

let logger: (message: string) => void = s => console.log(s);

export function setLogger(loggerFn: (message: string) => void) {
    logger = loggerFn;
}

function getValueString(value: any) {
    let stringify = "undefined";
    if (value !== undefined) {
        stringify = value.toString();
        stringify = stringify.length > 50 ? stringify.substr(0, 50) + "..." : stringify;
    }
    return stringify;
}

export function logStateChange(states: State<any, any>[], value: any, msg?: string) {
    let leading = states.slice(0, states.length - 1);
    let last = states[states.length - 1];

    const pathLeading = leading.map(s => `${s.name}`).join(" -> ");
    const pathLast = `${last.name} (${last.getObserverCount()})`;
    const path = leading.length > 0 ? pathLeading + " -> " + pathLast : pathLast;

    const valueString = getValueString(value);
    const mesgs = msg !== undefined ? "// " + msg : "";

    logger(`${path} = ${valueString} ${mesgs}`);
}
