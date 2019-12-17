import Node from './node.monad';
import PathSegment from './path-segment.monad';
import Monad from './monad';
import { map as _map } from 'lodash-es';

export type RawPath = [Node, Node, PathSegment[]];

export default class Path extends Monad<RawPath> {
    static of(val: any) {
        return new Path(val)
    }

    static from(val: any) {
        return val instanceof Path
            ? val
            : new Path(val)
    }

    private readonly start: Node;
    private readonly end: Node;
    private readonly segments: PathSegment[];

    constructor([start, end, segments]: RawPath) {
        super([start, end, segments]);

        this.start = Node.from(start);
        this.end = Node.from(end);
        this.segments = _map(segments, PathSegment.from);
    }

    getStart() {
        return this.start
    }

    getEnd() {
        return this.end
    }

    getSegments() {
        return this.segments
    }

    getLength() {
        return this.getSegments().length
    }
}
