import Monad from '../monad';
import Num from '../primitive/num/num.monad';
import None from '../primitive/none.monad';
import Maybe from '../primitive/maybe.monad';

import {formatAsFloat} from '../../utils/spatial.utils';
import Str from '../primitive/str.monad';

export interface RawPoint {
    srid: Num;
    x: Num;
    y: Num;
    z: Maybe<Num>;
}

export default class Point extends Monad<RawPoint> {
    static isPoint(val: any): val is Point {
        return val instanceof Point;
    }

    static of(val: any) {
        // @todo: improve typechecks
        const sane: RawPoint = {
            srid: Num.fromValue(val.srid),
            // @todo: this could be a perf issue?
            x: Num.fromValue(val.x),
            y: Num.fromValue(val.y),
            z: Maybe.of(
                val.z == null
                    ? None.of()
                    : Num.fromValue(val.z)
            ),
        };

        return new Point(sane);
    }

    static from(val: any) {
        return val instanceof Point
            ? val
            : Point.of(val);
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    is2d(): boolean {
        return None.isNone(this.getZ());
    }

    getSrid() {
        return this.original.srid;
    }

    getX() {
        return this.original.x;
    }

    getY() {
        return this.original.y;
    }

    getZ() {
        return this.original.z;
    }

    toString() {
        const ourZ = this.getZ();

        return ourZ.flatMap((zVal) => Str.of(None.isNone(zVal)
            ? `Point {srid=${formatAsFloat(this.getSrid())}, x=${formatAsFloat(
                this.getX()
            )}, y=${formatAsFloat(this.getY())}}`
            : `Point {srid=${formatAsFloat(this.getSrid())}, x=${formatAsFloat(
                this.getX()
            )}, y=${formatAsFloat(this.getY())}, z=${formatAsFloat(zVal)}}`
        )).get();
    }
}
