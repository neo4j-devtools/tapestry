import Num from './num/num.monad';
import Monad from './monad';

export interface RawRelationship {
    identity: Num;
    start: Num;
    end: Num;
    type: string;
    properties: Map<string, any>;
}

export default class Relationship extends Monad<RawRelationship> {
    static of(val: any) {
        return new Relationship(val)
    }

    static from(val: any) {
        return val instanceof Relationship
            ? val
            : new Relationship(val)
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    hasProperties() {
        return this.original.properties.size;
    }

    toString() {
        const value = this.original;
        let s = '(' + value.start + ')-[:' + value.type;

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

        s += ']->(' + value.end + ')';

        return s;
    }
}
