import Monad from './monad';
import Node from './node.monad';
import Relationship from './relationship.monad';

export type RawPathSegment = [Node, Relationship, Node];

export default class PathSegment extends Monad<RawPathSegment> {
    static of(val: any) {
        return new PathSegment(val)
    }

    static from(val: any) {
        return val instanceof PathSegment
            ? val
            : new PathSegment(val)
    }

    private readonly start: Node;
    private readonly end: Node;
    private readonly relationship: Relationship;

    constructor([start, relationship, end]: RawPathSegment) {
        super([start, relationship, end]);

        this.start = Node.from(start);
        this.relationship = Relationship.from(relationship);
        this.end = Node.from(end);
    }

    getStart() {
        return this.start
    }

    getEnd() {
        return this.end
    }

    getRelationship() {
        return this.relationship
    }
}
