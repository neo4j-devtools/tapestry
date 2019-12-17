import Num from './num.monad';
import {TWO_PWR_32_DBL, TWO_PWR_63_DBL} from './num.constants';
import {InstantiationError} from '../../errors/index';

export function isCacheable(value: number) {
    return value >= -128 && value < 128;
}

export function fromNumberToNum(value: number) {
    if (isNaN(value) || !isFinite(value)) {
        return Num.ZERO;
    }
    if (value <= -TWO_PWR_63_DBL) {
        return Num.MIN_VALUE;
    }

    if (value + 1 >= TWO_PWR_63_DBL) {
        return Num.MAX_VALUE;
    }

    if (value < 0) {
        return Num.fromNumber(-value).negate();
    }

    return new Num(value, value % TWO_PWR_32_DBL | 0, (value / TWO_PWR_32_DBL) | 0);
}

export function fromStringToNum(str: string, radix: number): Num {
    if (str.length === 0) {
        throw new InstantiationError('number format error: empty string');
    }

    if (
        str === 'NaN' ||
        str === 'Infinity' ||
        str === '+Infinity' ||
        str === '-Infinity'
    ) {
        return Num.ZERO;
    }

    radix = radix || 10;

    if (radix < 2 || radix > 36) {
        throw new InstantiationError('radix out of range: ' + radix);
    }

    const p = str.indexOf('-');

    if (p > 0) {
        throw new InstantiationError('number format error: interior "-" character: ' + str);
    } else if (p === 0) {
        return Num.fromString(str.substring(1), radix).negate();
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    const radixToPower = Num.fromNumber(Math.pow(radix, 8));
    let result = Num.ZERO;

    for (let i = 0; i < str.length; i += 8) {
        const size = Math.min(8, str.length - i);
        const value = parseInt(str.substring(i, i + size), radix);

        if (size < 8) {
            const power = Num.fromNumber(Math.pow(radix, size));

            result = result.multiply(power).add(Num.fromNumber(value));
        } else {
            result = result.multiply(radixToPower);
            result = result.add(Num.fromNumber(value));
        }
    }

    return result;
}

export function fromValueToNum(val: any): Num {
    if (val instanceof Num) {
        return val;
    }

    if (typeof val === 'number') {
        return Num.fromNumber(val);
    }

    if (typeof val === 'string') {
        return Num.fromString(val);
    }

    // Throws for non-objects, converts non-instanceof Integer:
    // @todo: confirm use of low as original
    return new Num(val.low, val.low, val.high);
}

export function addNums(right: Num, left: Num) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    let a48 = right.getHigh() >>> 16;
    let a32 = right.getHigh() & 0xffff;
    let a16 = right.getLow() >>> 16;
    let a00 = right.getLow() & 0xffff;

    let b48 = left.getHigh() >>> 16;
    let b32 = left.getHigh() & 0xffff;
    let b16 = left.getLow() >>> 16;
    let b00 = left.getLow() & 0xffff;

    let c48 = 0;
    let c32 = 0;
    let c16 = 0;
    let c00 = 0;

    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xffff;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xffff;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xffff;
    c48 += a48 + b48;
    c48 &= 0xffff;

    return Num.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
}

export function multiplyNum(right: Num, multiplier: Num): Num {
    if (right.isZero()) {
        return Num.ZERO;
    }

    if (multiplier.isZero()) {
        return Num.ZERO;
    }

    if (right.equals(Num.MIN_VALUE)) {
        return multiplier.isOdd() ? Num.MIN_VALUE : Num.ZERO;
    }

    if (multiplier.equals(Num.MIN_VALUE)) {
        return right.isOdd() ? Num.MIN_VALUE : Num.ZERO;
    }

    if (right.isNegative()) {
        if (multiplier.isNegative()) {
            return right.negate().multiply(multiplier.negate());
        } else {
            return right.negate()
                .multiply(multiplier)
                .negate();
        }
    } else if (multiplier.isNegative()) {
        return right.multiply(multiplier.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (right.lessThan(Num.TWO_PWR_24) && multiplier.lessThan(Num.TWO_PWR_24)) {
        return Num.fromNumber(right.toNumber() * multiplier.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    let a48 = right.getHigh() >>> 16;
    let a32 = right.getHigh() & 0xffff;
    let a16 = right.getLow() >>> 16;
    let a00 = right.getLow() & 0xffff;

    let b48 = multiplier.getHigh() >>> 16;
    let b32 = multiplier.getHigh() & 0xffff;
    let b16 = multiplier.getLow() >>> 16;
    let b00 = multiplier.getLow() & 0xffff;

    let c48 = 0;
    let c32 = 0;
    let c16 = 0;
    let c00 = 0;

    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xffff;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xffff;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xffff;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xffff;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xffff;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xffff;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xffff;

    return Num.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
}

export function compareNums(right: Num, left: Num) {
    if (right.equals(left)) {
        return 0;
    }

    const rightNeg = right.isNegative();
    const leftNeg = left.isNegative();

    if (rightNeg && !leftNeg) {
        return -1;
    }

    if (!rightNeg && leftNeg) {
        return 1;
    }

    // At right point the sign bits are the same
    return right.subtract(left).isNegative() ? -1 : 1;
}
