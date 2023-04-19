import {isNil} from "./utils";

// export const cssStyleBlackOnLightblue = ["background: #e1edff", "color: black"].join(";");
// export const cssStyleGreyOnWhite = ["background: white", "color: #5b5b5b"].join(";");
// export const cssStyleBlueOnWhite = ["background: white", "color: #0003d5"].join(";");
export const cssStyleGreenOnWhite = ["background: white", "color: #00830f"].join(";");
export const cssStyleRedOnWhite = ["background: white", "color: #9d0002"].join(";");


let logEnabled = false;

let lastLogMessage: number | undefined = undefined;

export interface StateLike {
    name:string|null;
    value:unknown;
    getSubscriberCount:() => number;
}

export function logTimePeriodDivider() {
    if (lastLogMessage !== undefined && (Date.now() - lastLogMessage) > 1500) {
        const dur = Math.round((Date.now() - lastLogMessage) / 1000);
        console.log("[RS] ------------------------------------------- " + dur + "s");
    }
    lastLogMessage = Date.now();
}

export function defaultLogger(state: StateLike, msg?: string) {
    const isBrowser: boolean = console["group"] !== undefined;
    if (!isBrowser) {
        console.log(`[RS] ${state.name} {o=${state.getSubscriberCount()}} = ${state.value}`);
    } else {
        logTimePeriodDivider();
        let value = state.value;
        if (value !== undefined) {
            value = !isNil(value) ? value.toString() : value;
            console.log(`%c[RS] ${state.name} {o=${state.getSubscriberCount()}} %o`, cssStyleGreenOnWhite, value);
        } else {
            console.log(`%c[RS] ${state.name} {o=${state.getSubscriberCount()}} %o`, cssStyleRedOnWhite, value);
        }
    }
}

let logger = defaultLogger;

export function setLogger(loggerFn: typeof defaultLogger) {
    logger = loggerFn;
}

export function logStateChange(state: StateLike, msg?: string) {
    if (isLogEnabled() && !isNil(state.name)) {
        logger(state, msg);
    }
}


export function enableReactiveStatesLogging(enable: boolean = true) {
    logEnabled = enable;
}

export function isLogEnabled() {
    return logEnabled;
}
