import {map as _map} from 'lodash';

import NodeMonad from './node.monad';
import PathSegment from './path-segment.monad';
import Monad from '../monad';
import {arrayHasItems} from '../../utils/array.utils';

export type RawPath = {
    start: NodeMonad,
    end: NodeMonad,
    segments: PathSegment[]
};

export default class Path extends Monad<RawPath> {
    static isPath(val: any) {
        return val instanceof Path;
    }

    static of(val: any) {
        const sane = {
            start: NodeMonad.from(val.start),
            end: NodeMonad.from(val.end),
            segments: _map(val.segments, PathSegment.from),
        };

        return new Path(sane);
    }

    static from(val: any) {
        return val instanceof Path
            ? val
            : Path.of(val);
    }

    hasSegments() {
        return arrayHasItems(this.original.segments);
    }

    getStart() {
        return this.original.start;
    }

    getEnd() {
        return this.original.end;
    }

    getSegments() {
        return this.original.segments;
    }

    getLength() {
        return this.getSegments().length;
    }
}
