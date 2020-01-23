import moment from 'moment';

import Num from '../primitive/num/num.monad';
import Monad from '../monad';
import {dateToIsoString} from '../../utils/temporal.utils';

export interface RawDate {
    year: Num;
    month: Num;
    day: Num;
}

export default class DateMonad extends Monad<RawDate> {
    static isDateMonad(val: any): val is DateMonad {
        return val instanceof DateMonad;
    }

    static of(val: any) {
        // @todo: improve typechecks
        const sane: RawDate = {
            year: Num.fromValue(val.year),
            month: Num.fromValue(val.month),
            day: Num.fromValue(val.day),
        };

        return new DateMonad(sane);
    }

    static from(val: any) {
        return val instanceof DateMonad
            ? val
            : DateMonad.of(val);
    }

    static fromStandardDate(standardDate: Date) {
        return DateMonad.of({
            year: standardDate.getFullYear(),
            month: standardDate.getMonth() + 1,
            day: standardDate.getDate()
        });
    }

    static fromMessage(days: Num = Num.of(0)) {
        return days.flatMap((no) => DateMonad.fromStandardDate(moment(0).add(no, 'days').toDate()));
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

    toString() {
        return `${dateToIsoString(this.getYear(), this.getMonth(), this.getDay())}`;
    }
}
