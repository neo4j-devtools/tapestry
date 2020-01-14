import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import Relationship from './relationship.monad';
import Str from '../primitive/str.monad';
import Dict from '../primitive/dict.monad';

export interface RawUnboundRelationship {
    identity: Num;
    type: Str;
    properties: Dict;
}

export default class UnboundRelationship extends Monad<RawUnboundRelationship> {
    static EMPTY = UnboundRelationship.of({});

    static isUnboundRelationship(val: any) {
        return val instanceof UnboundRelationship;
    }

    static of(val: any) {
        // @todo: improve typechecks
        const sane: RawUnboundRelationship = {
            identity: Num.fromValue(val.identity),
            type: Str.from(val.type),
            properties: Dict.from(val.properties)
        };

        return new UnboundRelationship(sane)
    }

    static from(val: any) {
        return val instanceof UnboundRelationship
            ? val
            : UnboundRelationship.of(val)
    }

    isEmpty(): boolean {
        return this.getIdentity().equals(0);
    }

    hasProperties() {
        return !this.original.properties.isEmpty();
    }

    getIdentity() {
        return this.original.identity;
    }

    getType() {
        return this.original.type;
    }

    getProperties() {
        return this.original.properties;
    }

    bind(start: Num, end: Num) {
        return Relationship.of({
            ...this.original,
            start,
            end
        });
    }

    toString() {
        const value = this.original;
        let s = '-[:' + value.type;

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

        s += ']->';

        return s;
    }
}
