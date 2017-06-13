import {State} from "./State";

const cssSuccessStyle = [
    "background: #D1ECBA",
    "color: white",
    "display: block",
    "text-align: center"
].join(";");

let logger: (message: string) => void = s => {
    if (console.debug) {
        console.debug("%c" + s, cssSuccessStyle);
    } else {
        console.log(s);
    }
};

let lastLogMessage: number | undefined = undefined;

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

export function logStateChange(state: State<any, any>, states: State<any, any>[], value: any, msg?: string) {
    if (lastLogMessage !== undefined && (Date.now() - lastLogMessage) > 1000) {
        logger("[RS] ------------------------------------------------------------------------------- " + (Date.now() - lastLogMessage) + "ms");
    }

    const path = states.map(s => `${s.name}`).join(" | ");
    const valueString = getValueString(value);
    const mesgs = msg !== undefined ? "// " + msg + " " : "";

    logger(`[RS] ${path} = ${valueString} ${mesgs}     {o=${state.getSubscriberCount()}}`);

    lastLogMessage = Date.now();
}
