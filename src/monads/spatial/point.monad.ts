import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import {formatAsFloat} from '../../utils/spatial.utils';
import None from '../primitive/none.monad';

export interface RawPoint {
    srid: Num;
    x: Num;
    y: Num;
    z: Num | None<number>;
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
            z: val.z == null
                ? None.of()
                : Num.fromValue(val.z),
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
        return None.isNone(this.getZ())
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

    toString () {
        const ourZ = this.getZ();

        return !None.isNone(ourZ)
            ? `Point{srid=${formatAsFloat(this.getSrid())}, x=${formatAsFloat(
                this.getX()
            )}, y=${formatAsFloat(this.getY())}, z=${formatAsFloat(ourZ)}}`
            : `Point{srid=${formatAsFloat(this.getSrid())}, x=${formatAsFloat(
                this.getX()
            )}, y=${formatAsFloat(this.getY())}}`
    }
}
