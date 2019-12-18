import Monad from '../monad';
import Num from '../primitive/num/num.monad';
import {durationToIsoString} from '../../utils/temporal.utils';

export interface RawDuration {
    months: Num;
    days: Num;
    seconds: Num;
    nanoseconds: Num;
}

export default class Duration extends Monad<RawDuration> {
    static isDuration(val: any): val is Duration {
        return val instanceof Duration;
    }

    static of(val: any) {
        // @todo: improve typechecks
        const sane: RawDuration = {
            months: Num.fromValue(val.months),
            days: Num.fromValue(val.days),
            seconds: Num.fromValue(val.seconds),
            nanoseconds: Num.fromValue(val.nanoseconds),
        };

        return new Duration(sane);
    }

    static from(val: any) {
        return val instanceof Duration
            ? val
            : Duration.of(val);
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    getMonths() {
        return this.original.months;
    }

    getDays() {
        return this.original.days;
    }

    getSeconds() {
        return this.original.seconds;
    }

    getNanoseconds() {
        return this.original.nanoseconds;
    }

    toString() {
        return durationToIsoString(
            this.getMonths(),
            this.getDays(),
            this.getSeconds(),
            this.getNanoseconds()
        );
    }
}
