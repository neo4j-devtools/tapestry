import Num from './num/num.monad';
import Monad from './monad';
import Relationship from './relationship.monad';

export interface RawUnboundRelationship {
    identity: Num;
    type: string;
    properties: Map<string, any>;
}

export default class UnboundRelationship extends Monad<RawUnboundRelationship> {
    static of(val: any) {
        return new UnboundRelationship(val)
    }

    static from(val: any) {
        return val instanceof UnboundRelationship
            ? val
            : new UnboundRelationship(val)
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    hasProperties() {
        return this.original.properties.size;
    }

    bind(start: Num, end: Num) {
        return Relationship.of({
            ...this.original,
            start,
            end
        });
    }

    /**
     * @ignore
     */
    toString() {
        const value = this.original;
        let s = '-[:' + value.type;

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

        s += ']->';

        return s;
    }
}
