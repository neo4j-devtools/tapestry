import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import Relationship from './relationship.monad';

export interface RawUnboundRelationship {
    identity: Num;
    type: string;
    properties: Map<string, any>;
}

export default class UnboundRelationship extends Monad<RawUnboundRelationship> {
    static isUnboundRelationship(val: any) {
        return val instanceof UnboundRelationship;
    }

    static of(val: any) {
        // @todo: improve typechecks
        const sane: RawUnboundRelationship = {
            identity: val.identity,
            type: val.type,
            properties: new Map(Object.entries(val.properties || {}))
        };

        return new UnboundRelationship(sane)
    }

    static from(val: any) {
        return val instanceof UnboundRelationship
            ? val
            : UnboundRelationship.of(val)
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    hasProperties() {
        return this.original.properties.size;
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
