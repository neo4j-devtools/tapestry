import {Monad, Str, Dict} from '@relate/types';

import Relationship from './relationship.monad';
import CypherNum from '../cypher-num/cypher-num.monad';

export interface RawUnboundRelationship {
    identity: CypherNum;
    type: Str;
    properties: Dict;
}

// @ts-ignore
export default class UnboundRelationship extends Monad<RawUnboundRelationship> {
    static EMPTY = UnboundRelationship.of({});

    get isEmpty(): boolean {
        return false;
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
            identity: CypherNum.fromValue(val.identity),
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

    bind(start: CypherNum, end: CypherNum) {
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
