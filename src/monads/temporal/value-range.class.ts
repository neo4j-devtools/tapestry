import Num from '../primitive/num/num.monad';

export class ValueRange {
    protected readonly minNum: Num;
    protected readonly maxNum: Num;

    constructor(protected readonly min: number, protected readonly max: number) {
        this.minNum = Num.of(min);
        this.maxNum = Num.of(max);
    }

    contains(value: number | Num) {
        const valToUse = Num.isNum(value)
            ? value
            : Num.fromValue(value);

        return (
            valToUse.greaterThanOrEqual(this.minNum) &&
            valToUse.lessThanOrEqual(this.maxNum)
        );
    }

    getMinNum() {
        return this.minNum;
    }

    getMaxNum() {
        return this.maxNum;
    }

    getMin() {
        return this.min;
    }

    getMax() {
        return this.max;
    }

    toString() {
        return `[${this.getMin()}, ${this.getMax()}]`;
    }
}
