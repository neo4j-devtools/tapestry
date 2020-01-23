import moment from 'moment';

import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import Str from '../primitive/str.monad';
import None from '../primitive/none.monad';
import Maybe from '../primitive/maybe.monad';
import {
    localDateTimeToString,
    timeZoneOffsetInSeconds,
    timeZoneOffsetToIsoString,
    totalNanoseconds
} from '../../utils/temporal.utils';

export interface RawDateTime {
    year: Num;
    month: Num;
    day: Num;
    hour: Num;
    minute: Num;
    second: Num;
    nanosecond: Num;
    timeZoneOffsetSeconds: Maybe<Num>;
    timeZoneId: Maybe<Str>;
}

export default class DateTime extends Monad<RawDateTime> {
    static isDateTime(val: any): val is DateTime {
        return val instanceof DateTime;
    }

    static of(val: any) {
        // @todo: improve typechecks
        const sane: RawDateTime = {
            year: Num.fromValue(val.year),
            month: Num.fromValue(val.month),
            day: Num.fromValue(val.day),
            hour: Num.fromValue(val.hour),
            minute: Num.fromValue(val.minute),
            second: Num.fromValue(val.second),
            nanosecond: Num.fromValue(val.nanosecond),
            timeZoneOffsetSeconds: Maybe.of(
                val.timeZoneOffsetSeconds == null
                    ? None.EMPTY
                    : Num.fromValue(val.timeZoneOffsetSeconds)
            ),
            timeZoneId: Maybe.of(
                val.timeZoneId
                    ? Str.from(val.timeZoneId)
                    : None.EMPTY
            ),
        };

        return new DateTime(sane);
    }

    static from(val: any) {
        return val instanceof DateTime
            ? val
            : DateTime.of(val);
    }

    static fromStandardDate(standardDate: Date, nanosecond: Num, timeZoneId?: Str) {
        return DateTime.of({
            year: standardDate.getFullYear(),
            month: standardDate.getMonth() + 1,
            day: standardDate.getDate(),
            hour: standardDate.getHours(),
            minute: standardDate.getMinutes(),
            second: standardDate.getSeconds(),
            nanosecond: totalNanoseconds(standardDate, nanosecond),
            timeZoneOffsetSeconds: timeZoneOffsetInSeconds(standardDate),
            timeZoneId: Maybe.of(
                timeZoneId && !timeZoneId.isEmpty()
                    ? timeZoneId
                    : None.EMPTY
            )
        });
    }

    static fromMessage(seconds: Num = Num.of(0), nanoseconds: Num = Num.of(0)) {
        return seconds.flatMap((secs) => DateTime.fromStandardDate(
            moment(0).add(secs, 'seconds').toDate(),
            nanoseconds,
            None.EMPTY // @todo: more
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

    getTimeZoneOffsetSeconds() {
        return this.original.timeZoneOffsetSeconds;
    }

    getTimeZoneId() {
        return this.original.timeZoneId;
    }

    toString() {
        const localDateTimeStr = localDateTimeToString(
            this.getYear(),
            this.getMonth(),
            this.getDay(),
            this.getHour(),
            this.getMinute(),
            this.getSecond(),
            this.getNanosecond()
        );
        const zoneId = this.getTimeZoneId().getOrElse(Str.of(''));
        const timeZoneOffsetSeconds = this.getTimeZoneOffsetSeconds().getOrElse(Num.of(0));
        const timeZoneStr = !zoneId.isEmpty()
            ? zoneId.map((zone) => `[${zone}]`).get()
            : timeZoneOffsetToIsoString(timeZoneOffsetSeconds.get());

        return `${localDateTimeStr}${timeZoneStr}}`;
    }
}
