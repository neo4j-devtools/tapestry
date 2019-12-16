import Monad from '../monad';
import NodeMonad from './node.monad';
import Relationship from './relationship.monad';

export type RawPathSegment = {
    start: NodeMonad,
    relationship: Relationship,
    end: NodeMonad
}

export default class PathSegment extends Monad<RawPathSegment> {
    static isPathSegment(val: any): val is PathSegment {
        return val instanceof PathSegment;
    }

    static of(val: any) {
        const sane = {
            start: NodeMonad.from(val.start),
            relationship: Relationship.from(val.relationship),
            end: NodeMonad.from(val.end),
        };

        return new PathSegment(sane);
    }

    static from(val: any) {
        return val instanceof PathSegment
            ? val
            : PathSegment.of(val);
    }

    getStart() {
        return this.original.start;
    }

    getEnd() {
        return this.original.end;
    }

    getRelationship() {
        return this.original.relationship;
    }
}
