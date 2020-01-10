import Monad from '../monad';
import Num from '../primitive/num/num.monad';
import {arrayHasItems} from '../../utils/array.utils';

export interface RawNode {
    identity: Num;
    labels: string[];
    // @todo: typings
    properties: Map<string, any>;
}

export default class NodeMonad extends Monad<RawNode> {
    static isNode(val: any) {
        return val instanceof NodeMonad;
    }

    static of(val: any) {
        // @todo: improve typechecks
        // @todo: Monads?
        const sane: RawNode = {
            identity: val.identity,
            labels: val.labels,
            properties: new Map(Object.entries(val.properties || {}))
        };

        return new NodeMonad(sane)
    }

    static from(val: any) {
        return val instanceof NodeMonad
            ? val
            : NodeMonad.of(val)
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    hasProperties() {
        return this.original.properties.size
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

        for (let i = 0; i < value.labels.length; i++) {
            s += ':' + value.labels[i];
        }

        if (this.hasProperties()) {
            s += ' {';

            let first = true;
            for (const [key, val] of value.properties.entries()) {
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
