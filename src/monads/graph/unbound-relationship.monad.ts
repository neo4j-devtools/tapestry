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

    get isEmpty(): boolean {
        return false
    }

    get hasProperties() {
        return !this.original.properties.isEmpty;
    }

    get identity() {
        return this.original.identity;
    }

    get type() {
        return this.original.type;
    }

    get properties() {
        return this.original.properties;
    }

    static isUnboundRelationship(val: any): val is UnboundRelationship {
        return val instanceof UnboundRelationship;
    }

    static of(val: any): UnboundRelationship {
        // @todo: improve typechecks
        const sane: RawUnboundRelationship = {
            identity: Num.fromValue(val.identity),
            type: Str.from(val.type),
            properties: Dict.from(val.properties)
        };

        return new UnboundRelationship(sane);
    }

    static from(val: any): UnboundRelationship {
        return UnboundRelationship.isUnboundRelationship(val)
            ? val
            : UnboundRelationship.of(val);
    }

    bind(start: Num, end: Num) {
        return Relationship.of({
            ...this.original,
            start,
            end
        });
    }

    toString() {
        let s = '-[:' + this.type;

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

        s += ']->';

        return `${this.constructor.name} {${s}}`;
    }
}
