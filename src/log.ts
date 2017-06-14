import * as _ from "lodash";
import {State} from "./State";

export const cssStyleBlackOnLightblue = ["background: #e1edff", "color: black"].join(";");
export const cssStyleGreyOnWhite = ["background: white", "color: #5b5b5b"].join(";");
export const cssStyleBlueOnWhite = ["background: white", "color: #0003d5"].join(";");
export const cssStyleGreenOnWhite = ["background: white", "color: #00830f"].join(";");
export const cssStyleRedOnWhite = ["background: white", "color: #9d0002"].join(";");


let logEnabled = false;

let lastLogMessage: number | undefined = undefined;

export function defaultLogger(state: State<any, any>, states: State<any, any>[], msg?: string) {
    if (lastLogMessage !== undefined && (Date.now() - lastLogMessage) > 1000) {
        console.log("[RS] -------------------------------------------------- " + (Date.now() - lastLogMessage) + "ms");
    }

    const isBrowser: boolean = _.hasIn(console, "group");
    if (!isBrowser) {
        console.log(`[RS] ${state.name} {o=${state.getSubscriberCount()}} = ${state.value}`);

    } else {
        const value = state.value;
        if (value !== undefined) {
            console.log(`%c[RS] ${state.name} {o=${state.getSubscriberCount()}} %0`, cssStyleGreenOnWhite, value);
        } else {
            console.log(`%c[RS] ${state.name} {o=${state.getSubscriberCount()}} %0`, cssStyleRedOnWhite, value);
        }
    }

    lastLogMessage = Date.now();
}

let logger = defaultLogger;

export function setLogger(loggerFn: typeof defaultLogger) {
    logger = loggerFn;
}

export function logStateChange(state: State<any, any>, states: State<any, any>[], msg?: string) {
    if (isLogEnabled() && state.name !== undefined) {
        logger(state, states, msg);
    }
}


export function enableReactiveStatesLogging() {
    logEnabled = true;
}

export function isLogEnabled() {
    return logEnabled;
}
