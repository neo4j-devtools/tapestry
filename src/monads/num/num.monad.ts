import Monad from '../monad';
import {TWO_PWR_24_DBL, TWO_PWR_32_DBL} from './num.constants';
import {addNums, compareNums, fromNumberToNum, fromStringToNum, fromValueToNum, isCacheable, multiplyNum} from './num.utils';

export default class Num extends Monad<number> {
    static readonly INT_CACHE = new Map();
    static readonly ZERO = Num.fromInt(0);
    static readonly ONE = Num.fromInt(1);
    static readonly NEG_ONE = Num.fromInt(-1);
    static readonly MAX_VALUE = Num.fromBits(0xffffffff | 0, 0x7fffffff | 0);
    static readonly MIN_VALUE = Num.fromBits(0, 0x80000000 | 0);
    static readonly MIN_SAFE_VALUE = Num.fromBits(0x1 | 0, 0xffffffffffe00000 | 0);
    static readonly MAX_SAFE_VALUE = Num.fromBits(0xffffffff | 0, 0x1fffff | 0);
    static readonly TWO_PWR_24 = Num.fromInt(TWO_PWR_24_DBL);

    static isNum(other: any): other is Num {
        // @todo: strict constructor check?
        return other && other instanceof Num ? true : false;
    }

    static of(val: any): Num {
        return new Num(Number(val));
    }

    static fromInt(val: number): Num {
        if (!isCacheable(val)) {
            return new Num(val);
        }

        if (!Num.INT_CACHE.has(val)) {
            Num.INT_CACHE.set(val, new Num(val));
        }

        return Num.INT_CACHE.get(val);
    }

    static fromNumber(value: number): Num {
        return fromNumberToNum(value);
    }

    static fromBits(lowBits: number, highBits: number): Num {
        // @todo: confirm original value
        return new Num(lowBits, lowBits, highBits);
    }

    static fromString(str: string, radix = 10): Num {
        return fromStringToNum(str, radix);
    }

    static fromValue(val: any): Num {
        return fromValueToNum(val);
    }

    toNumber(): number {
        return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    }

    constructor(value: number = 0, private readonly low = value, private readonly high = value < 0 ? -1 : 0) {
        super(value);
    }

    isEmpty(): boolean {
        return typeof this.original === 'number' && !isNaN(this.original);
    }

    isZero(): boolean {
        return this.getHigh() === 0 && this.getLow() === 0;
    }

    isOdd(): boolean {
        return (this.getLow() & 1) === 1;
    }

    isEven(): boolean{
        return (this.getLow() & 1) === 0;
    }

    isNegative(): boolean {
        return this.getHigh() < 0;
    }

    isPositive(): boolean {
        return this.getHigh() >= 0;
    }

    equals(other: any): boolean {
        const otherToUse = Num.isNum(other)
            ? other
            : Num.fromValue(other);

        return this.getHigh() === otherToUse.getHigh() && this.getLow() === otherToUse.getLow();
    }

    lessThan(other: number | string | Num): boolean {
        return this.compare(other) < 0;
    }

    lessThanOrEqual(other: number | string | Num): boolean {
        return this.compare(other) <= 0;
    }

    greaterThan(other: number | string | Num): boolean {
        return this.compare(other) > 0;
    }

    greaterThanOrEqual(other: number | string | Num): boolean {
        return this.compare(other) >= 0;
    }

    getHigh(): number {
        return this.high;
    }

    getLow(): number {
        return this.low;
    }

    negate(): Num {
        if (this.equals(Num.MIN_VALUE)) {
            return Num.MIN_VALUE;
        }

        return this.not().add(Num.ONE);
    }

    add(other: number | string | Num): Num {
        const otherToUse = Num.isNum(other)
            ? other
            : Num.fromValue(other);

        return addNums(this, otherToUse);
    }

    subtract(other: number | string | Num): Num {
        const otherToUse = Num.isNum(other)
            ? other
            : Num.fromValue(other);

        return this.add(otherToUse.negate());
    }

    not(): Num {
        return Num.fromBits(~this.getLow(), ~this.getHigh());
    }

    multiply(multiplier: number | string | Num): Num {
        const multiplierToUse = Num.isNum(multiplier)
            ? multiplier
            : Num.fromValue(multiplier);

        return multiplyNum(this, multiplierToUse);
    }

    compare(other: number | string | Num): 0 | -1 | 1 {
        const otherToUse = Num.isNum(other)
            ? other
            : Num.fromValue(other);

        return compareNums(this, otherToUse);
    }
}
