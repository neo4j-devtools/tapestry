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

    get isEmpty() {
        return false;
    }

    get hasProperties() {
        return !this.original.properties.isEmpty;
    }

    get hasLabels() {
        return arrayHasItems(this.original.labels);
    }

    get identity() {
        return this.original.identity;
    }

    get labels() {
        return this.original.labels;
    }

    get properties() {
        return this.original.properties;
    }

    static isNodeMonad(val: any): val is NodeMonad {
        return val instanceof NodeMonad;
    }

    static of(val: any): NodeMonad {
        // @todo: improve typechecks?
        const sane: RawNode = {
            identity: Num.fromValue(val.identity),
            labels: List.from(val.labels),
            properties: Dict.from(val.properties)
        };

        return new NodeMonad(sane);
    }

    static from(val: any): NodeMonad {
        return NodeMonad.isNodeMonad(val)
            ? val
            : NodeMonad.of(val);
    }

    toString() {
        let s = '(' + this.identity;

        for (const label of this.labels) {
            s += ':' + label;
        }

        if (this.hasProperties) {
            s += ' {';

            let first = true;
            for (const [key, val] of this.properties) {
                if (!first) {
                    s += ',';
                }

                s += key + ':' + JSON.stringify(val);
                first = false;
            }

            s += '}';
        }

        s += ')';

        return `${this.constructor.name} {${s}}`;
    }
}
