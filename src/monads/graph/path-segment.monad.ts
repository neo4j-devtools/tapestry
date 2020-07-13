import {Monad} from '@relate/types';
import NodeMonad from './node.monad';
import Relationship from './relationship.monad';

export type RawPathSegment = {
    start: NodeMonad,
    relationship: Relationship,
    end: NodeMonad
}

// @ts-ignore
export default class PathSegment extends Monad<RawPathSegment> {
    get start() {
        return this.original.start;
    }

    get end() {
        return this.original.end;
    }

    get relationship() {
        return this.original.relationship;
    }

    static isPathSegment(val: any): val is PathSegment {
        return val instanceof PathSegment;
    }

    static of(val: any): PathSegment {
        const sane = {
            start: NodeMonad.from(val.start),
            relationship: Relationship.from(val.relationship),
            end: NodeMonad.from(val.end),
        };

        return new PathSegment(sane);
    }

    static from(val: any): PathSegment {
        return PathSegment.isPathSegment(val)
            ? val
            : PathSegment.of(val);
    }
}
