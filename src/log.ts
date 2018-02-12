import * as _ from "lodash";
import {State} from "./State";

export const cssStyleBlackOnLightblue = ["background: #e1edff", "color: black"].join(";");
export const cssStyleGreyOnWhite = ["background: white", "color: #5b5b5b"].join(";");
export const cssStyleBlueOnWhite = ["background: white", "color: #0003d5"].join(";");
export const cssStyleGreenOnWhite = ["background: white", "color: #00830f"].join(";");
export const cssStyleRedOnWhite = ["background: white", "color: #9d0002"].join(";");


let logEnabled = false;

let lastLogMessage: number | undefined = undefined;

export function logTimePeriodDivider() {
    if (lastLogMessage !== undefined && (Date.now() - lastLogMessage) > 1500) {
        const dur = Math.round((Date.now() - lastLogMessage) / 1000);
        console.log("[RS] " + _.repeat("-", 100) + " " + dur + "s");
    }
    lastLogMessage = Date.now();
}

export function defaultLogger(state: State<any, any>, msg?: string) {
    const isBrowser: boolean = _.hasIn(console, "group");
    if (!isBrowser) {
        console.log(`[RS] ${state.name} {o=${state.getSubscriberCount()}} = ${state.value}`);
    } else {
        logTimePeriodDivider();
        let value = state.value;
        if (value !== undefined) {
            value = value.toString();
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

export function logStateChange(state: State<any, any>, msg?: string) {
    if (isLogEnabled() && !_.isNil(state.name)) {
        logger(state, msg);
    }
}


export function enableReactiveStatesLogging(enable: boolean = true) {
    logEnabled = enable;
}

export function isLogEnabled() {
    return logEnabled;
}
