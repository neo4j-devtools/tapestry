import Monad from '../monad';
import Num from '../primitive/num/num.monad';
import {arrayHasItems} from '../../utils/array.utils';
import Str from '../primitive/str.monad';
import Dict from '../primitive/dict.monad';
import List from '../primitive/list.monad';

export interface RawNode {
    identity: Num;
    labels: List<Str>;
    // @todo: typings
    properties: Dict;
}

export default class NodeMonad extends Monad<RawNode> {
    static EMPTY = NodeMonad.of({});

    static isNode(val: any): val is NodeMonad {
        return val instanceof NodeMonad;
    }

    static of(val: any) {
        // @todo: improve typechecks?
        const sane: RawNode = {
            identity: Num.fromValue(val.identity),
            labels: List.from(val.labels),
            properties: Dict.from(val.properties)
        };

        return new NodeMonad(sane)
    }

    static from(val: any) {
        return val instanceof NodeMonad
            ? val
            : NodeMonad.of(val)
    }

    isEmpty(): boolean {
        return this.getIdentity().equals(0);
    }

    hasProperties() {
        return !this.original.properties.isEmpty()
    }

    hasLabels() {
        return arrayHasItems(this.original.labels);
    }

    getIdentity() {
        return this.original.identity;
    }

    getLabels() {
        return this.original.labels;
    }

    getProperties() {
        return this.original.properties;
    }

    toString() {
        const value = this.original;
        let s = '(' + value.identity;

        for (const label of value.labels) {
            s += ':' + label;
        }

        if (this.hasProperties()) {
            s += ' {';

            let first = true;
            for (const [key, val] of value.properties) {
                if (!first) {
                    s += ',';
                }

                s += key + ':' + JSON.stringify(val);
                first = false;
            }

            s += '}';
        }

        s += ')';

        return s;
    }
}
