import {
    DAYS_0000_TO_1970,
    DAYS_PER_400_YEAR_CYCLE,
    MINUTES_PER_HOUR,
    NANOS_PER_HOUR,
    NANOS_PER_MILLISECOND,
    NANOS_PER_MINUTE,
    NANOS_PER_SECOND,
    SECONDS_PER_DAY,
    SECONDS_PER_HOUR,
    SECONDS_PER_MINUTE
} from '../monads/temporal/temporal.constants';
import {Num} from '../monads/index';
import LocalTime from '../monads/temporal/local-time.monad';
import LocalDateTime from '../monads/temporal/local-date-time.monad';
import DateMonad from '../monads/temporal/date.monad';

/*
  Code in this util should be compatible with code in the database that uses JSR-310 java.time APIs.
  It is based on a library called ThreeTen (https://github.com/ThreeTen/threetenbp) which was derived
  from JSR-310 reference implementation previously hosted on GitHub. Code uses `Integer` type everywhere
  to correctly handle large integer values that are greater than `Number.MAX_SAFE_INTEGER`.
  Please consult either ThreeTen or js-joda (https://github.com/js-joda/js-joda) when working with the
  conversion functions.
 */

export function normalizeSecondsForDuration(seconds: number, nanoseconds: number) {
    return Num.fromValue(seconds).add(floorDiv(nanoseconds, NANOS_PER_SECOND));
}

export function normalizeNanosecondsForDuration(nanoseconds: number) {
    return floorMod(nanoseconds, NANOS_PER_SECOND);
}

/**
 * Converts given local time into a single integer representing this same time in nanoseconds of the day.
 * @param {Integer|number|string} hour the hour of the local time to convert.
 * @param {Integer|number|string} minute the minute of the local time to convert.
 * @param {Integer|number|string} second the second of the local time to convert.
 * @param {Integer|number|string} nanosecond the nanosecond of the local time to convert.
 * @return {Integer} nanoseconds representing the given local time.
 */
export function localTimeToNanoOfDay(hour: Num | number | string, minute: Num | number | string, second: Num | number | string, nanosecond: Num | number | string) {
    return Num.fromValue(hour).multiply(NANOS_PER_HOUR)
        .add(Num.fromValue(minute).multiply(NANOS_PER_MINUTE))
        .add(Num.fromValue(second).multiply(NANOS_PER_SECOND))
        .add(Num.fromValue(nanosecond));
}

/**
 * Converts nanoseconds of the day into local time.
 * @param {Integer|number|string} nanoOfDay the nanoseconds of the day to convert.
 * @return {LocalTime} the local time representing given nanoseconds of the day.
 */
export function nanoOfDayToLocalTime(nanoOfDay: Num | number | string): LocalTime {
    // @todo: perf of repeated operations?
    const nanoOfDayToUse = Num.fromValue(nanoOfDay);
    const hour = nanoOfDayToUse.divide(NANOS_PER_HOUR);
    const minute = nanoOfDayToUse
        .subtract(hour.multiply(NANOS_PER_HOUR))
        .divide(NANOS_PER_MINUTE);
    const second = nanoOfDayToUse
        .subtract(hour.multiply(NANOS_PER_HOUR))
        .subtract(minute.multiply(NANOS_PER_MINUTE))
        .divide(NANOS_PER_SECOND);
    const nanosecond = nanoOfDayToUse
        .subtract(hour.multiply(NANOS_PER_HOUR))
        .subtract(minute.multiply(NANOS_PER_MINUTE))
        .subtract(second.multiply(NANOS_PER_SECOND));

    return LocalTime.of({hour, minute, second, nanosecond});
}

/**
 * Converts given local date time into a single integer representing this same time in epoch seconds UTC.
 * @param {Integer|number|string} year the year of the local date-time to convert.
 * @param {Integer|number|string} month the month of the local date-time to convert.
 * @param {Integer|number|string} day the day of the local date-time to convert.
 * @param {Integer|number|string} hour the hour of the local date-time to convert.
 * @param {Integer|number|string} minute the minute of the local date-time to convert.
 * @param {Integer|number|string} second the second of the local date-time to convert.
 * @param {Integer|number|string} nanosecond the nanosecond of the local date-time to convert.
 * @return {Integer} epoch second in UTC representing the given local date time.
 */
export function localDateTimeToEpochSecond(
    year: Num | number | string,
    month: Num | number | string,
    day: Num | number | string,
    hour: Num | number | string,
    minute: Num | number | string,
    second: Num | number | string,
    // nanosecond: Num | number | string
): Num {
    const epochDay = dateToEpochDay(year, month, day);
    const localTimeSeconds = localTimeToSecondOfDay(hour, minute, second);

    return epochDay.multiply(SECONDS_PER_DAY).add(localTimeSeconds);
}

/**
 * Converts given epoch second and nanosecond adjustment into a local date time object.
 * @param {Integer|number|string} epochSecond the epoch second to use.
 * @param {Integer|number|string} nano the nanosecond to use.
 * @return {LocalDateTime} the local date time representing given epoch second and nano.
 */
export function epochSecondAndNanoToLocalDateTime(epochSecond: Num | number | string, nano: Num | number | string): LocalDateTime {
    const epochDay = floorDiv(epochSecond, SECONDS_PER_DAY);
    const secondsOfDay = floorMod(epochSecond, SECONDS_PER_DAY);
    const nanoOfDay = secondsOfDay.multiply(NANOS_PER_SECOND).add(nano);
    const localDate = epochDayToDate(epochDay);
    const localTime = nanoOfDayToLocalTime(nanoOfDay);

    return LocalDateTime.of({
        year: localDate.getYear(),
        month: localDate.getMonth(),
        day: localDate.getDay(),
        hour: localTime.getHour(),
        minute: localTime.getMinute(),
        second: localTime.getSecond(),
        nanoSecond: localTime.getNanosecond()
    });
}

/**
 * Converts given local date into a single integer representing it's epoch day.
 * @param {Integer|number|string} year the year of the local date to convert.
 * @param {Integer|number|string} month the month of the local date to convert.
 * @param {Integer|number|string} day the day of the local date to convert.
 * @return {Integer} epoch day representing the given date.
 */
export function dateToEpochDay(year: Num | number | string, month: Num | number | string, day: Num | number | string) {
    year = Num.fromValue(year);
    month = Num.fromValue(month);
    day = Num.fromValue(day);

    let epochDay = year.multiply(365);

    if (year.greaterThanOrEqual(0)) {
        epochDay = epochDay.add(
            year
                .add(3)
                .divide(4)
                .subtract(year.add(99).divide(100))
                .add(year.add(399).divide(400))
        );
    } else {
        epochDay = epochDay.subtract(
            year
                .divide(-4)
                .subtract(year.divide(-100))
                .add(year.divide(-400))
        );
    }

    epochDay = epochDay.add(
        month
            .multiply(367)
            .subtract(362)
            .divide(12)
    );
    epochDay = epochDay.add(day.subtract(1));

    if (month.greaterThan(2)) {
        epochDay = epochDay.subtract(1);
        if (!isLeapYear(year)) {
            epochDay = epochDay.subtract(1);
        }
    }

    return epochDay.subtract(DAYS_0000_TO_1970);
}

/**
 * Converts given epoch day to a local date.
 * @param {Integer|number|string} epochDay the epoch day to convert.
 * @return {DateMonad} the date representing the epoch day in years, months and days.
 */
export function epochDayToDate(epochDay: Num | number | string): DateMonad {
    epochDay = Num.fromValue(epochDay);

    let zeroDay = epochDay.add(DAYS_0000_TO_1970).subtract(60);
    let adjust = Num.fromValue(0);
    if (zeroDay.lessThan(0)) {
        const adjustCycles = zeroDay
            .add(1)
            .divide(DAYS_PER_400_YEAR_CYCLE)
            .subtract(1);

        adjust = adjustCycles.multiply(400);
        zeroDay = zeroDay.add(adjustCycles.multiply(-DAYS_PER_400_YEAR_CYCLE));
    }
    let year = zeroDay
        .multiply(400)
        .add(591)
        .divide(DAYS_PER_400_YEAR_CYCLE);
    let dayOfYearEst = zeroDay.subtract(
        year
            .multiply(365)
            .add(year.divide(4))
            .subtract(year.divide(100))
            .add(year.divide(400))
    );
    if (dayOfYearEst.lessThan(0)) {
        year = year.subtract(1);
        dayOfYearEst = zeroDay.subtract(
            year
                .multiply(365)
                .add(year.divide(4))
                .subtract(year.divide(100))
                .add(year.divide(400))
        );
    }
    year = year.add(adjust);
    let marchDayOfYear = dayOfYearEst;

    const marchMonth = marchDayOfYear
        .multiply(5)
        .add(2)
        .divide(153);
    const month = marchMonth
        .add(2)
        .modulo(12)
        .add(1);
    const day = marchDayOfYear
        .subtract(
            marchMonth
                .multiply(306)
                .add(5)
                .divide(10)
        )
        .add(1);
    year = year.add(marchMonth.divide(10));

    return DateMonad.of({year, month, day});
}

/**
 * Format given duration to an ISO 8601 string.
 * @param {Integer|number|string} months the number of months.
 * @param {Integer|number|string} days the number of days.
 * @param {Integer|number|string} seconds the number of seconds.
 * @param {Integer|number|string} nanoseconds the number of nanoseconds.
 * @return {string} ISO string that represents given duration.
 */
export function durationToIsoString(months: Num | number | string, days: Num | number | string, seconds: Num | number | string, nanoseconds: Num | number | string): string {
    const monthsString = formatNumber(months);
    const daysString = formatNumber(days);
    const secondsAndNanosecondsString = formatSecondsAndNanosecondsForDuration(
        seconds,
        nanoseconds
    );

    return `P${monthsString}M${daysString}DT${secondsAndNanosecondsString}S`;
}

/**
 * Formats given time to an ISO 8601 string.
 * @param {Integer|number|string} hour the hour value.
 * @param {Integer|number|string} minute the minute value.
 * @param {Integer|number|string} second the second value.
 * @param {Integer|number|string} nanosecond the nanosecond value.
 * @return {string} ISO string that represents given time.
 */
export function timeToIsoString(hour: Num | number | string, minute: Num | number | string, second: Num | number | string, nanosecond: Num | number | string) {
    const hourString = formatNumber(hour, 2);
    const minuteString = formatNumber(minute, 2);
    const secondString = formatNumber(second, 2);
    const nanosecondString = formatNanosecond(nanosecond);

    return `${hourString}:${minuteString}:${secondString}${nanosecondString}`;
}

/**
 * Formats given time zone offset in seconds to string representation like '±HH:MM', '±HH:MM:SS' or 'Z' for UTC.
 * @param {Integer|number|string} offsetSeconds the offset in seconds.
 * @return {string} ISO string that represents given offset.
 */
export function timeZoneOffsetToIsoString(offsetSeconds: Num | number | string) {
    offsetSeconds = Num.fromValue(offsetSeconds);

    if (offsetSeconds.equals(0)) {
        return 'Z';
    }

    const isNegative = offsetSeconds.isNegative();

    if (isNegative) {
        offsetSeconds = offsetSeconds.multiply(-1);
    }

    const signPrefix = isNegative ? '-' : '+';

    const hours = formatNumber(offsetSeconds.divide(SECONDS_PER_HOUR), 2);
    const minutes = formatNumber(
        offsetSeconds.divide(SECONDS_PER_MINUTE).modulo(MINUTES_PER_HOUR),
        2
    );
    let secondsValue = offsetSeconds.modulo(SECONDS_PER_MINUTE);

    const seconds = secondsValue.equals(0) ? null : formatNumber(secondsValue, 2);

    return seconds
        ? `${signPrefix}${hours}:${minutes}:${seconds}`
        : `${signPrefix}${hours}:${minutes}`;
}

/**
 * Formats given date to an ISO 8601 string.
 * @param {Integer|number|string} year the date year.
 * @param {Integer|number|string} month the date month.
 * @param {Integer|number|string} day the date day.
 * @return {string} ISO string that represents given date.
 */
export function dateToIsoString(year: Num | number | string, month: Num | number | string, day: Num | number | string) {
    year = Num.fromValue(year);
    const isNegative = year.isNegative();

    if (isNegative) {
        year = year.multiply(-1);
    }

    let yearString = formatNumber(year, 4);

    if (isNegative) {
        yearString = '-' + yearString;
    }

    const monthString = formatNumber(month, 2);
    const dayString = formatNumber(day, 2);

    return `${yearString}-${monthString}-${dayString}`;
}

/**
 * Get the total number of nanoseconds from the milliseconds of the given standard JavaScript date and optional nanosecond part.
 * @param {global.Date} standardDate the standard JavaScript date.
 * @param {Integer|number|undefined} nanoseconds the optional number of nanoseconds.
 * @return {Integer|number} the total amount of nanoseconds.
 */
export function totalNanoseconds(standardDate: Date, nanoseconds: Num | number | string): Num {
    return Num.fromValue(nanoseconds || 0)
        .add(standardDate.getMilliseconds() * NANOS_PER_MILLISECOND);
}

/**
 * Get the time zone offset in seconds from the given standard JavaScript date.
 *
 * <b>Implementation note:</b>
 * Time zone offset returned by the standard JavaScript date is the difference, in minutes, from local time to UTC.
 * So positive value means offset is behind UTC and negative value means it is ahead.
 * For Neo4j temporal types, like `Time` or `DateTime` offset is in seconds and represents difference from UTC to local time.
 * This is different from standard JavaScript dates and that's why implementation negates the returned value.
 *
 * @param {global.Date} standardDate the standard JavaScript date.
 * @return {number} the time zone offset in seconds.
 */
export function timeZoneOffsetInSeconds(standardDate: Date): number {
    let offsetInMinutes = standardDate.getTimezoneOffset();
    if (offsetInMinutes === 0) {
        return 0;
    }

    return -1 * offsetInMinutes * SECONDS_PER_MINUTE;
}

/**
 * Converts given local time into a single integer representing this same time in seconds of the day. Nanoseconds are skipped.
 * @param {Integer|number|string} hour the hour of the local time.
 * @param {Integer|number|string} minute the minute of the local time.
 * @param {Integer|number|string} second the second of the local time.
 * @return {Integer} seconds representing the given local time.
 */
function localTimeToSecondOfDay(hour: Num | number | string, minute: Num | number | string, second: Num | number | string): Num {
    return Num.fromValue(hour).multiply(SECONDS_PER_HOUR)
        .add(Num.fromValue(minute).multiply(SECONDS_PER_MINUTE))
        .add(second);
}

/**
 * Check if given year is a leap year. Uses algorithm described here {@link https://en.wikipedia.org/wiki/Leap_year#Algorithm}.
 * @param {Integer|number|string} year the year to check. Will be converted to {@link Integer} for all calculations.
 * @return {boolean} `true` if given year is a leap year, `false` otherwise.
 */
function isLeapYear(year: Num | number | string): boolean {
    year = Num.fromValue(year);

    if (!year.modulo(4).equals(0)) {
        return false;
    }

    if (!year.modulo(100).equals(0)) {
        return true;
    }

    if (!year.modulo(400).equals(0)) {
        return false;
    }

    return true;
}

/**
 * @param {Integer|number|string} x the divident.
 * @param {Integer|number|string} y the divisor.
 * @return {Integer} the result.
 */
function floorDiv(x: Num | number | string, y: Num | number | string): Num {
    x = Num.fromValue(x);
    y = Num.fromValue(y);

    let result = x.divide(y);

    if (x.isPositive() !== y.isPositive() && !result.multiply(y).equals(x)) {
        result = result.subtract(1);
    }

    return result;
}

/**
 * @param {Integer|number|string} x the divident.
 * @param {Integer|number|string} y the divisor.
 * @return {Integer} the result.
 */
function floorMod(x: Num | number | string, y: Num | number | string): Num {
    x = Num.fromValue(x);
    y = Num.fromValue(y);

    return x.subtract(floorDiv(x, y).multiply(y));
}

/**
 * @param {Integer|number|string} seconds the number of seconds to format.
 * @param {Integer|number|string} nanoseconds the number of nanoseconds to format.
 * @return {string} formatted value.
 */
function formatSecondsAndNanosecondsForDuration(seconds: Num | number | string, nanoseconds: Num | number | string): string {
    seconds = Num.fromValue(seconds);
    nanoseconds = Num.fromValue(nanoseconds);

    let secondsString;
    let nanosecondsString;

    const secondsNegative = seconds.isNegative();
    const nanosecondsGreaterThanZero = nanoseconds.greaterThan(0);
    if (secondsNegative && nanosecondsGreaterThanZero) {
        if (seconds.equals(-1)) {
            secondsString = '-0';
        } else {
            secondsString = seconds.add(1).toString();
        }
    } else {
        secondsString = seconds.toString();
    }

    if (nanosecondsGreaterThanZero) {
        if (secondsNegative) {
            nanosecondsString = formatNanosecond(
                nanoseconds
                    .negate()
                    .add(2 * NANOS_PER_SECOND)
                    .modulo(NANOS_PER_SECOND)
            );
        } else {
            nanosecondsString = formatNanosecond(
                nanoseconds.add(NANOS_PER_SECOND).modulo(NANOS_PER_SECOND)
            );
        }
    }

    return nanosecondsString ? secondsString + nanosecondsString : secondsString;
}

/**
 * @param {Integer|number|string} value the number of nanoseconds to format.
 * @return {string} formatted and possibly left-padded nanoseconds part as string.
 */
function formatNanosecond(value: Num | number | string): string {
    value = Num.fromValue(value);

    return value.equals(0) ? '' : '.' + formatNumber(value, 9);
}

/**
 * @param {Integer|number|string} num the number to format.
 * @param {number} [stringLength=undefined] the string length to left-pad to.
 * @return {string} formatted and possibly left-padded number as string.
 */
function formatNumber(num: Num | number | string, stringLength?: number) {
    num = Num.fromValue(num);
    const isNegative = num.isNegative();
    if (isNegative) {
        num = num.negate();
    }

    let numString = num.toString();
    if (stringLength) {
        // left pad the string with zeroes
        while (numString.length < stringLength) {
            numString = '0' + numString;
        }
    }
    return isNegative ? '-' + numString : numString;
}

export function localDateTimeToString(
    year: Num,
    month: Num,
    day: Num,
    hour: Num,
    minute: Num,
    second: Num,
    nanosecond: Num
): string {
    return (
        dateToIsoString(year, month, day) +
        'T' +
        timeToIsoString(hour, minute, second, nanosecond)
    );
}
