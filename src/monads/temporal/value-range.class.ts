import Num from '../primitive/num/num.monad';
import {boundMethod} from 'autobind-decorator';

export class ValueRange {
    protected readonly minNum: Num;
    protected readonly maxNum: Num;

    constructor(protected readonly min: number, protected readonly max: number) {
        this.minNum = Num.of(min);
        this.maxNum = Num.of(max);
    }

    @boundMethod
    contains(value: number | Num) {
        const valToUse = Num.isNum(value)
            ? value
            : Num.fromValue(value);

        return (
            valToUse.greaterThanOrEqual(this.minNum) &&
            valToUse.lessThanOrEqual(this.maxNum)
        );
    }

    @boundMethod
    getMinNum() {
        return this.minNum;
    }

    @boundMethod
    getMaxNum() {
        return this.maxNum;
    }

    @boundMethod
    getMin() {
        return this.min;
    }

    @boundMethod
    getMax() {
        return this.max;
    }

    @boundMethod
    toString() {
        return `[${this.getMin()}, ${this.getMax()}]`;
    }
}
