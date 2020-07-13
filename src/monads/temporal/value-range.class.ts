import CypherNum from '../cypher-num/cypher-num.monad';
import {boundMethod} from 'autobind-decorator';

export class ValueRange {
    protected readonly minNum: CypherNum;
    protected readonly maxNum: CypherNum;

    constructor(protected readonly min: number, protected readonly max: number) {
        this.minNum = CypherNum.of(min);
        this.maxNum = CypherNum.of(max);
    }

    @boundMethod
    contains(value: number | CypherNum) {
        const valToUse = CypherNum.isCypherNum(value)
            ? value
            : CypherNum.fromValue(value);

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
