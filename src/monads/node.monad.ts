import Monad from './monad';
import Num from './num/num.monad';

export interface RawNode {
    identity: Num;
    labels: string[];
    // @todo: typings
    properties: Map<string, any>;
}

export default class Node extends Monad<RawNode> {
    static of(val: any) {
        return new Node(val)
    }

    static from(val: any) {
        return val instanceof Node
            ? val
            : new Node(val)
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    hasProperties() {
        return this.original.properties.size
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
