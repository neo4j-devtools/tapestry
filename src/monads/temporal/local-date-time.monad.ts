import moment from 'moment';

import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import {localDateTimeToString, totalNanoseconds} from '../../utils/temporal.utils';

export interface RawLocalDateTime {
    year: Num;
    month: Num;
    day: Num;
    hour: Num;
    minute: Num;
    second: Num;
    nanosecond: Num;
}

export default class LocalDateTime extends Monad<RawLocalDateTime> {
    static isLocalDateTime(val: any): val is LocalDateTime {
        return val instanceof LocalDateTime;
    }

    static of(val: any) {
        // @todo: improve typechecks
        const sane: RawLocalDateTime = {
            year: Num.fromValue(val.year),
            month: Num.fromValue(val.month),
            day: Num.fromValue(val.day),
            hour: Num.fromValue(val.hour),
            minute: Num.fromValue(val.minute),
            second: Num.fromValue(val.second),
            nanosecond: Num.fromValue(val.nanosecond)
        };

        return new LocalDateTime(sane);
    }

    static from(val: any) {
        return val instanceof LocalDateTime
            ? val
            : LocalDateTime.of(val);
    }

    static fromStandardDate(standardDate: Date, nanosecond: Num) {
        return LocalDateTime.of({
            year: standardDate.getFullYear(),
            month: standardDate.getMonth() + 1,
            day: standardDate.getDate(),
            hour: standardDate.getHours(),
            minute: standardDate.getMinutes(),
            second: standardDate.getSeconds(),
            nanosecond: totalNanoseconds(standardDate, nanosecond)
        });
    }

    static fromMessage(seconds: Num = Num.of(0), nanoseconds: Num = Num.of(0)) {
        return seconds.flatMap((secs) => LocalDateTime.fromStandardDate(
            moment(0).add(secs, 'seconds').toDate(),
            nanoseconds
        ));
    }

    isEmpty(): boolean {
        return false; // @todo
    }

    getYear() {
        return this.original.year;
    }

    getMonth() {
        return this.original.month;
    }

    getDay() {
        return this.original.day;
    }

    getHour() {
        return this.original.hour;
    }

    getMinute() {
        return this.original.minute;
    }

    getSecond() {
        return this.original.second;
    }

    getNanosecond() {
        return this.original.nanosecond;
    }

    toString() {
        return localDateTimeToString(
            this.getYear(),
            this.getMonth(),
            this.getDay(),
            this.getHour(),
            this.getMinute(),
            this.getSecond(),
            this.getNanosecond()
        );
    }
}
