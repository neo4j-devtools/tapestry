import {Monad, None, Maybe, Str} from '@relate/types';

import CypherNum from '../cypher-num/cypher-num.monad';
import {formatAsFloat} from '../../utils/spatial.utils';

export interface RawPoint {
    srid: CypherNum;
    x: CypherNum;
    y: CypherNum;
    z: Maybe<CypherNum>;
}

// @ts-ignore
export default class Point extends Monad<RawPoint> {
    get isEmpty(): boolean {
        return false; // @todo
    }

    get is2d(): boolean {
        return None.isNone(this.z);
    }

    get srid() {
        return this.original.srid;
    }

    get x() {
        return this.original.x;
    }

    get y() {
        return this.original.y;
    }

    get z() {
        return this.original.z;
    }

    static isPoint(val: any): val is Point {
        return val instanceof Point;
    }

    static of(val: any): Point {
        // @todo: improve typechecks
        const sane: RawPoint = {
            srid: CypherNum.fromValue(val.srid),
            // @todo: this could be a perf issue?
            x: CypherNum.fromValue(val.x),
            y: CypherNum.fromValue(val.y),
            z: Maybe.of(
                val.z == null
                    ? None.of()
                    : CypherNum.fromValue(val.z)
            ),
        };

        return new Point(sane);
    }

    static from(val: any): Point {
        return Point.isPoint(val)
            ? val
            : Point.of(val);
    }

    toString() {
        const {x, y, z, srid} = this;

        return z.flatMap((zVal) => Str.of(None.isNone(zVal)
            ? `Point {srid=${formatAsFloat(srid)}, x=${formatAsFloat(x)}, y=${formatAsFloat(y)}}`
            : `Point {srid=${formatAsFloat(srid)}, x=${formatAsFloat(x)}, y=${formatAsFloat(y)}, z=${formatAsFloat(zVal)}}`
        )).get();
    }
}
