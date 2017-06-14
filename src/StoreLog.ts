import * as _ from "lodash";

let logFn: (event: LogEvent) => void = defaultLog;

const cssStyleAction = ["background: #e1edff", "color: black"].join(";");
const cssStyleFieldAdded = ["background: white", "color: #0003d5"].join(";");
const cssStyleFieldChanged = ["background: white", "color: #00830f"].join(";");
const cssStyleFieldRemoved = ["background: white", "color: #5a0001"].join(";");


export type FieldChangeType = "added" | "changed" | "removed";

export class LogEvent {
    constructor(public action: string,
                public changes: [FieldChangeType, string, any][]) {
    }
}

export function defaultLog(event: LogEvent) {
    const isBrowser: boolean = _.hasIn(console, "group");
    if (!isBrowser) {
        console.log(event.action);
        event.changes.forEach(([changeType, fieldName, value]) => {
            console.log("    [" + changeType + "] " + fieldName + " = " + value);
        });
    } else {
        console.group(event.action);
        event.changes.forEach(([changeType, fieldName, value]) => {
            console.log("    [" + changeType + "] " + fieldName);
            if (changeType === "added") {
                console.log("%c" + fieldName + " %o", cssStyleFieldAdded, value);
            } else if (changeType === "changed") {
                console.log("%c" + fieldName + " %o", cssStyleFieldChanged, value);
            } else if (changeType === "removed") {
                console.log("%c" + fieldName, cssStyleFieldRemoved);
            }

        });
        console.groupEnd();
    }
}

export function setLogger(fn: (event: LogEvent) => void) {
    logFn = fn;
}

export function logStoreEvent(event: LogEvent) {
    logFn(event);
}

