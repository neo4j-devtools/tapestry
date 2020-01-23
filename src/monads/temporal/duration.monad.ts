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
    get isEmpty(): boolean {
        return false; // @todo
    }

    get months() {
        return this.original.months;
    }

    get days() {
        return this.original.days;
    }

    get seconds() {
        return this.original.seconds;
    }

    get nanoseconds() {
        return this.original.nanoseconds;
    }

    static isDuration(val: any): val is Duration {
        return val instanceof Duration;
    }

    static of(val: any): Duration {
        // @todo: improve typechecks
        const sane: RawDuration = {
            months: Num.fromValue(val.months),
            days: Num.fromValue(val.days),
            seconds: Num.fromValue(val.seconds),
            nanoseconds: Num.fromValue(val.nanoseconds),
        };

        return new Duration(sane);
    }

    static from(val: any): Duration {
        return Duration.isDuration(val)
            ? val
            : Duration.of(val);
    }

    toString() {
        return durationToIsoString(
            this.months,
            this.days,
            this.seconds,
            this.nanoseconds
        );
    }
}
