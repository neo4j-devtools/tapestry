import {map as _map} from 'lodash';

import Monad from '../monad';
import NodeMonad from './node.monad';
import PathSegment from './path-segment.monad';
import List from '../primitive/list.monad';
import {arrayHasItems} from '../../utils/array.utils';

export type RawPath = {
    start: NodeMonad,
    end: NodeMonad,
    segments: List<PathSegment>
};

export default class Path extends Monad<RawPath> {
    get hasSegments() {
        return arrayHasItems(this.original.segments);
    }

    get start() {
        return this.original.start;
    }

    get end() {
        return this.original.end;
    }

    get segments() {
        return this.original.segments;
    }

    get length() {
        return this.segments.length;
    }

    static isPath(val: any): val is Path {
        return val instanceof Path;
    }

    static of(val: any): Path {
        const sane = {
            start: NodeMonad.from(val.start),
            end: NodeMonad.from(val.end),
            segments: List.from<PathSegment>(_map(val.segments, PathSegment.from)),
        };

        return new Path(sane);
    }

    static from(val: any): Path {
        return Path.isPath(val)
            ? val
            : Path.of(val);
    }
}
