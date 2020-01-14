import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import Str from '../primitive/str.monad';
import Dict from '../primitive/dict.monad';

export interface RawRelationship {
    identity: Num;
    start: Num;
    end: Num;
    type: Str;
    properties: Dict;
}

export default class Relationship extends Monad<RawRelationship> {
    static EMPTY = Relationship.of({});

    static isRelationship(val: any) {
        return val instanceof Relationship;
    }

    static of(val: any) {
        // @todo: improve typechecks
        const sane: RawRelationship = {
            identity: Num.fromValue(val.identity),
            start: Num.fromValue(val.start),
            end: Num.fromValue(val.end),
            type: Str.from(val.type),
            properties: Dict.from(val.properties)
        };

        return new Relationship(sane)
    }

    static from(val: any) {
        return val instanceof Relationship
            ? val
            : Relationship.of(val)
    }

    isEmpty(): boolean {
        return this.getIdentity().equals(0);
    }

    hasProperties() {
        return !this.original.properties.isEmpty()
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

            for (const [key, val] of value.properties) {
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
