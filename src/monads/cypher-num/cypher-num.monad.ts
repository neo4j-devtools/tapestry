import {Monad} from '@relate/types';
import {DEFAULT_NUM_RADIX, TWO_PWR_24_DBL, TWO_PWR_32_DBL} from './cypher-num.constants';
import {
    addNums,
    compareNums,
    divideNums,
    fromNumberToNum,
    fromNumToString,
    fromStringToNum,
    fromValueToNum,
    isCacheable,
    multiplyNum,
    shiftNumLeft,
    shiftNumRight
} from '../../utils/num.utils';

export default class CypherNum extends Monad<number> {
    static readonly INT_CACHE = new Map();
    static readonly ZERO = CypherNum.fromInt(0);
    static readonly ONE = CypherNum.fromInt(1);
    static readonly NEG_ONE = CypherNum.fromInt(-1);
    static readonly MAX_VALUE = CypherNum.fromBits(0xffffffff | 0, 0x7fffffff | 0);
    static readonly MIN_VALUE = CypherNum.fromBits(0, 0x80000000 | 0);
    static readonly MIN_SAFE_VALUE = CypherNum.fromBits(0x1 | 0, 0xffffffffffe00000 | 0);
    static readonly MAX_SAFE_VALUE = CypherNum.fromBits(0xffffffff | 0, 0x1fffff | 0);
    static readonly TWO_PWR_24 = CypherNum.fromInt(TWO_PWR_24_DBL);

    constructor(value: number = 0, private readonly ourLow = value, private readonly ourHigh = value < 0 ? -1 : 0) {
        super(value);
    }

    get isEmpty(): boolean {
        return typeof this.original !== 'number' || isNaN(this.original);
    }

    get isZero(): boolean {
        return this.high === 0 && this.low === 0;
    }

    get isOdd(): boolean {
        return (this.low & 1) === 1;
    }

    get isEven(): boolean {
        return (this.low & 1) === 0;
    }

    get isNegative(): boolean {
        return this.high < 0;
    }

    get isPositive(): boolean {
        return this.high >= 0;
    }

    get isInteger(): boolean {
        return Number.isInteger(this.original);
    }

    get high(): number {
        return this.ourHigh;
    }

    get low(): number {
        return this.ourLow;
    }

    static isCypherNum(val: any): val is CypherNum {
        return val instanceof CypherNum;
    }

    static of(val: any): CypherNum {
        return new CypherNum(Number(val));
    }

    static from(val: any): CypherNum {
        return CypherNum.isCypherNum(val)
            ? val
            : CypherNum.of(val);
    }

    static fromInt(val: number): CypherNum {
        if (!isCacheable(val)) {
            return CypherNum.of(val);
        }

        if (!CypherNum.INT_CACHE.has(val)) {
            CypherNum.INT_CACHE.set(val, CypherNum.of(val));
        }

        return CypherNum.INT_CACHE.get(val);
    }

    static fromNumber(value: number): CypherNum {
        return fromNumberToNum(value);
    }

    static fromBits(lowBits: number, highBits: number): CypherNum {
        // @todo: confirm original value
        return new CypherNum(lowBits, lowBits, highBits);
    }

    static fromString(str: string, radix: number = DEFAULT_NUM_RADIX): CypherNum {
        return fromStringToNum(str, radix);
    }

    static fromValue(val: any = 0): CypherNum {
        return fromValueToNum(val);
    }

    toNumber(): number {
        return this.ourHigh * TWO_PWR_32_DBL + (this.ourLow >>> 0);
    }

    toString(radix: number = DEFAULT_NUM_RADIX): string {
        return `${fromNumToString(this, radix)}`;
    }

    toInt(): CypherNum {
        return CypherNum.fromInt(this.low);
    }

    toNumberOrInfinity() {
        if (this.lessThan(CypherNum.MIN_SAFE_VALUE)) {
            return Number.NEGATIVE_INFINITY;
        }

        if (this.greaterThan(CypherNum.MAX_SAFE_VALUE)) {
            return Number.POSITIVE_INFINITY;
        }

        return this.toNumber();
    }

    equals(other: any): boolean {
        const otherToUse = CypherNum.isCypherNum(other)
            ? other
            : CypherNum.fromValue(other);

        return this.high === otherToUse.high && this.low === otherToUse.low;
    }

    lessThan(other: number | string | CypherNum): boolean {
        return this.compare(other) < 0;
    }

    lessThanOrEqual(other: number | string | CypherNum): boolean {
        return this.compare(other) <= 0;
    }

    greaterThan(other: number | string | CypherNum): boolean {
        return this.compare(other) > 0;
    }

    greaterThanOrEqual(other: number | string | CypherNum): boolean {
        return this.compare(other) >= 0;
    }

    negate(): CypherNum {
        if (this.equals(CypherNum.MIN_VALUE)) {
            return CypherNum.MIN_VALUE;
        }

        return this.not().add(CypherNum.ONE);
    }

    add(other: number | string | CypherNum): CypherNum {
        const otherToUse = CypherNum.isCypherNum(other)
            ? other
            : CypherNum.fromValue(other);

        return addNums(this, otherToUse);
    }

    subtract(other: number | string | CypherNum): CypherNum {
        const otherToUse = CypherNum.isCypherNum(other)
            ? other
            : CypherNum.fromValue(other);

        return this.add(otherToUse.negate());
    }

    not(): CypherNum {
        return CypherNum.fromBits(~this.low, ~this.high);
    }

    multiply(multiplier: number | string | CypherNum): CypherNum {
        const multiplierToUse = CypherNum.isCypherNum(multiplier)
            ? multiplier
            : CypherNum.fromValue(multiplier);

        return multiplyNum(this, multiplierToUse);
    }

    divide(divisor: number | string | CypherNum): CypherNum {
        const divisorToUse = CypherNum.isCypherNum(divisor)
            ? divisor
            : CypherNum.fromValue(divisor);

        return divideNums(this, divisorToUse);
    }

    modulo(divisor: number | string | CypherNum): CypherNum {
        const divisorToUse = CypherNum.isCypherNum(divisor)
            ? divisor
            : CypherNum.fromValue(divisor);

        return this.subtract(this.divide(divisorToUse).multiply(divisorToUse));
    }

    compare(other: number | string | CypherNum): 0 | -1 | 1 {
        const otherToUse = CypherNum.isCypherNum(other)
            ? other
            : CypherNum.fromValue(other);

        return compareNums(this, otherToUse);
    }

    shiftLeft(numBits: number | string | CypherNum): CypherNum {
        const numBitsToUse = CypherNum.isCypherNum(numBits)
            ? numBits
            : CypherNum.fromValue(numBits);

        return shiftNumLeft(this, numBitsToUse);
    }

    shiftRight(numBits: number | string | CypherNum): CypherNum {
        const numBitsToUse = CypherNum.isCypherNum(numBits)
            ? numBits
            : CypherNum.fromValue(numBits);

        return shiftNumRight(this, numBitsToUse);
    }
}
