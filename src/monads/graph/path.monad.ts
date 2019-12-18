import {map as _map} from 'lodash-es';

import Node from './node.monad';
import PathSegment from './path-segment.monad';
import Monad from '../monad';
import {arrayHasItems} from '../../utils/array.utils';

export type RawPath = {
    start: Node,
    end: Node,
    segments: PathSegment[]
};

export default class Path extends Monad<RawPath> {
    static isPath(val: any) {
        return val instanceof Path;
    }

    static of(val: any) {
        const sane = {
            start: Node.from(val.start),
            end: Node.from(val.end),
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
