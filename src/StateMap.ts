import {InputState} from "./InputState";
import {State} from "./Component";

export class StateMap<T, S extends State<T>> extends InputState<{[key: string]: S}> {

    constructor(private stateFactory: () => S) {
        super({});
    }

    clear(): this {
        for (let id in this.val) {
            const state = this.val[id];
            state.disconnect();
        }

        this.putValue({});
        return this;
    }

    get(id: string): S {
        this.doModify(map => {
            if (map[id] == undefined) {
                map[id] = this.stateFactory();
            }
            return map;
        });

        return this.val[id];
    }

    remove(id: string): S {
        this.doModify(map => {
            const state = map[id];
            state && state.disconnect();
            delete map[id];
            return map;
        });

        return this.val[id];
    }

}

export function stateMap<T, S extends State<T>>(stateFactory: () => S) {
    return new StateMap(stateFactory);
}
