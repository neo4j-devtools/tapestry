import Num from '../primitive/num/num.monad';
import Monad from '../monad';

export interface RawRelationship {
    identity: Num;
    start: Num;
    end: Num;
    type: string;
    properties: Map<string, any>;
}

export default class Relationship extends Monad<RawRelationship> {
    static isRelationship(val: any) {
        return val instanceof Relationship;
    }

    static of(val: any) {
        // @todo: improve typechecks
        const sane: RawRelationship = {
            identity: val.identity,
            start: val.start,
            end: val.end,
            type: val.type,
            properties: new Map(Object.entries(val.properties || {}))
        };

        return new Relationship(sane)
    }

    static from(val: any) {
        return val instanceof Relationship
            ? val
            : Relationship.of(val)
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    hasProperties() {
        return this.original.properties.size
    }

    getIdentity() {
        return this.original.identity;
    }

    getType() {
        return this.original.type;
    }

    getStart() {
        return this.original.start;
    }

    getEnd() {
        return this.original.end;
    }

    getProperties() {
        return this.original.properties;
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
