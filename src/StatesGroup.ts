import {State} from "./State";

let nextStoreId = 0;

export class StatesGroup {

    readonly storeId = nextStoreId++;

    name = "store-" + this.storeId;

    protected members: State<any, any>[] | null = null;

    protected autoInitMembers = true;

    constructor() {
        if (this.autoInitMembers) {
            setTimeout(() => this.initializeMembers(), 0);
        }
    }

    // enableLog(enable: boolean): this {
    //     this.initializeMembers();
    //     this.members!.forEach(m => m.logEnabled = enable);
    //     return this;
    // }

    connectAll(): this {
        this.initializeMembers();
        this.members!.forEach(m => m.connect());
        return this;
    }

    disconnectAll(): this {
        this.initializeMembers();
        this.members!.forEach(m => m.disconnect());
        return this;
    }

    protected initializeMembers(path: string = "", obj: any = this) {
        if (this.members !== null) {
            return;
        }
        this.members = [];
        for (const propertyName in obj) {
            if (obj.hasOwnProperty(propertyName)) {
                const member = obj[propertyName];

                if (member instanceof State) {
                    member.name = this.name + path + "." + propertyName;
                    this.members.push(member);
                } else if (typeof member === "object") {
                    this.initializeMembers(path + "." + propertyName, member);
                }
            }
        }
    }

}
