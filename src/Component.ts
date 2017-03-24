import * as _ from "lodash";
import {Injectable} from "./Context";
import {State} from "./State";

let nextStoreId = 0;

export class Component implements Injectable {

    readonly storeId = nextStoreId++;

    name = "store-" + this.storeId;

    protected members: State<any>[] | null = null;

    enableLog(enable: boolean) {
        if (enable) {
            if (this.members === null) {
                this.initializeMembers();
            }
        }
        this.members!.forEach(m => m.logEnabled = enable);
        return this;
    }

    protected initializeMembers(path: string = "", obj: any = this) {
        this.members = [];
        for (const propertyName in obj) {
            if (obj.hasOwnProperty(propertyName)) {
                const member = obj[propertyName];

                if (member instanceof State) {
                    member.name = this.name + path + "." + propertyName;
                    this.members.push(member);
                }

                else if (_.isPlainObject(member)) {
                    this.initializeMembers(path + "." + propertyName, member);
                }

            }
        }

    }

}
