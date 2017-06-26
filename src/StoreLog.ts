import * as _ from "lodash";
import {cssStyleBlueOnWhite, cssStyleGreenOnWhite, cssStyleRedOnWhite, isLogEnabled, logTimePeriodDivider} from "./log";

let logFn: (event: LogEvent) => void = defaultLog;

export type FieldChangeType = "added" | "changed" | "removed";

export class LogEvent {
    constructor(public name: string,
                public changes: [FieldChangeType, string, any][],
                public stack: string | undefined) {
    }
}

export function isBrowser(): boolean {
    return _.hasIn(console, "debug") && _.hasIn(console, "group");
}

export function defaultLog(event: LogEvent) {
    if (!isBrowser()) {
        console.log(event.name);
        event.changes.forEach(([changeType, fieldName, value]) => {
            console.log("    [" + changeType + "] " + fieldName + " = " + value);
        });
    } else {
        logTimePeriodDivider();
        console.group(event.name);
        event.changes.forEach(([changeType, fieldName, value]) => {
            if (changeType === "added") {
                console.log("%c" + fieldName + " %o", cssStyleGreenOnWhite, value);
            } else if (changeType === "changed") {
                console.log("%c" + fieldName + " %o", cssStyleBlueOnWhite, value);
            } else if (changeType === "removed") {
                console.log("%c" + fieldName, cssStyleRedOnWhite);
            }
        });

        console.groupEnd();
    }
}

export function logInvalidDataChange(key: string, version1: any, version2: any): Error {
    const msg = `invalid attempt to mutate this.data.${key}`;
    if (isLogEnabled()) {
        if (isBrowser()) {
            console.error("[RS] " + msg, version1, version2);
        } else {
            console.log("[RS] Error: " + msg);
        }
    }
    return new Error(msg);
}

export function setLogger(fn: (event: LogEvent) => void) {
    logFn = fn;
}

export function logStoreEvent(event: LogEvent) {
    if (isLogEnabled()) {
        logFn(event);
    }
}
