import {
    DATE,
    DATE_STRUCT_SIZE,
    DATE_TIME_WITH_ZONE_ID,
    DATE_TIME_WITH_ZONE_ID_STRUCT_SIZE,
    DATE_TIME_WITH_ZONE_OFFSET,
    DATE_TIME_WITH_ZONE_OFFSET_STRUCT_SIZE,
    DURATION,
    DURATION_STRUCT_SIZE,
    LOCAL_DATE_TIME,
    LOCAL_DATE_TIME_STRUCT_SIZE,
    LOCAL_TIME,
    LOCAL_TIME_STRUCT_SIZE,
    POINT_2D,
    POINT_2D_STRUCT_SIZE,
    POINT_3D,
    POINT_3D_STRUCT_SIZE,
    TIME,
    TIME_STRUCT_SIZE
} from './packer.constants';
import {DateMonad, DateTime, Duration, LocalDateTime, LocalTime, None, Num, Point, TimeMonad} from '../../../monads/index';
import {Packer, Unpacker} from './packer.v2';
import BaseBuffer from '../../buffers/base.buffer';
import {
    dateToEpochDay,
    epochDayToDate,
    epochSecondAndNanoToLocalDateTime,
    localDateTimeToEpochSecond,
    localTimeToNanoOfDay,
    nanoOfDayToLocalTime
} from '../../../utils/temporal.utils';


/**
 * Pack given 2D or 3D point.
 * @param {Point} point the point value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packPoint(point: Point, packer: Packer): void {
    if (point.is2d()) {
        packPoint2D(point, packer);

        return;
    }

    packPoint3D(point, packer);
}

/**
 * Pack given 2D point.
 * @param {Point} point the point value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packPoint2D(point: Point, packer: Packer): void {
    const packableStructFields = [
        packer.packable(Num.fromValue(point.getSrid())),
        packer.packable(Num.fromValue(point.getX())),
        packer.packable(Num.fromValue(point.getY()))
    ];

    packer.packStruct(POINT_2D, packableStructFields);
}

/**
 * Pack given 3D point.
 * @param {Point} point the point value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packPoint3D(point: Point, packer: Packer): void {
    const packableStructFields = [
        packer.packable(Num.fromValue(point.getSrid())),
        packer.packable(Num.fromValue(point.getX())),
        packer.packable(Num.fromValue(point.getY())),
        packer.packable(Num.fromValue(point.getZ()))
    ];

    packer.packStruct(POINT_3D, packableStructFields);
}

/**
 * Unpack 2D point value using the given unpacker.
 * @param {Unpacker} unpacker the unpacker to use.
 * @param {number} structSize the retrieved struct size.
 * @param {BaseBuffer} buffer the buffer to unpack from.
 * @return {Point} the unpacked 2D point value.
 */
export function unpackPoint2D(unpacker: Unpacker, structSize: number, buffer: BaseBuffer): Point {
    unpacker.verifyStructSize('Point2D', POINT_2D_STRUCT_SIZE, structSize);

    return Point.of({
        srid: unpacker.unpack(buffer),
        x: unpacker.unpack(buffer),
        y: unpacker.unpack(buffer),
        z: undefined
    });
}

/**
 * Unpack 3D point value using the given unpacker.
 * @param {Unpacker} unpacker the unpacker to use.
 * @param {number} structSize the retrieved struct size.
 * @param {BaseBuffer} buffer the buffer to unpack from.
 * @return {Point} the unpacked 3D point value.
 */
export function unpackPoint3D(unpacker: Unpacker, structSize: number, buffer: BaseBuffer): Point {
    unpacker.verifyStructSize('Point3D', POINT_3D_STRUCT_SIZE, structSize);

    return Point.of({
        srid: unpacker.unpack(buffer),
        x: unpacker.unpack(buffer),
        y: unpacker.unpack(buffer),
        z: unpacker.unpack(buffer)
    });
}

/**
 * Pack given duration.
 * @param {Duration} value the duration value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packDuration(value: Duration, packer: Packer): void {
    const months = Num.fromValue(value.getMonths());
    const days = Num.fromValue(value.getDays());
    const seconds = Num.fromValue(value.getSeconds());
    const nanoseconds = Num.fromValue(value.getNanoseconds());

    const packableStructFields = [
        packer.packable(months),
        packer.packable(days),
        packer.packable(seconds),
        packer.packable(nanoseconds)
    ];

    packer.packStruct(DURATION, packableStructFields);
}

/**
 * Unpack duration value using the given unpacker.
 * @param {Unpacker} unpacker the unpacker to use.
 * @param {number} structSize the retrieved struct size.
 * @param {BaseBuffer} buffer the buffer to unpack from.
 * @return {Duration} the unpacked duration value.
 */
export function unpackDuration(unpacker: Unpacker, structSize: number, buffer: BaseBuffer): Duration {
    unpacker.verifyStructSize('Duration', DURATION_STRUCT_SIZE, structSize);

    const months = unpacker.unpack(buffer);
    const days = unpacker.unpack(buffer);
    const seconds = unpacker.unpack(buffer);
    const nanoseconds = unpacker.unpack(buffer);

    return Duration.of({months, days, seconds, nanoseconds});
}

/**
 * Pack given local time.
 * @param {LocalTime} value the local time value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packLocalTime(value: LocalTime, packer: Packer): void {
    const nanoOfDay = localTimeToNanoOfDay(
        value.getHour(),
        value.getMinute(),
        value.getSecond(),
        value.getNanosecond()
    );
    const packableStructFields = [packer.packable(nanoOfDay)];

    packer.packStruct(LOCAL_TIME, packableStructFields);
}

/**
 * Unpack local time value using the given unpacker.
 * @param {Unpacker} unpacker the unpacker to use.
 * @param {number} structSize the retrieved struct size.
 * @param {BaseBuffer} buffer the buffer to unpack from.
 * @param {boolean} disableLosslessIntegers if integer properties in the result local time should be native JS numbers.
 * @return {LocalTime} the unpacked local time value.
 */
export function unpackLocalTime(
    unpacker: Unpacker,
    structSize: number,
    buffer: BaseBuffer,
    // @ts-ignore
    disableLosslessIntegers: boolean
): LocalTime {
    unpacker.verifyStructSize('LocalTime', LOCAL_TIME_STRUCT_SIZE, structSize);

    // @todo: 0 was missing?
    const nanoOfDay = unpacker.unpackIntegerBuffer(buffer);
    const result = nanoOfDayToLocalTime(nanoOfDay);

    return result;
    // @todo: wtf?
    // return convertIntegerPropsIfNeeded(result, disableLosslessIntegers);
}

/**
 * Pack given time.
 * @param {Time} value the time value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packTime(value: TimeMonad, packer: Packer): void {
    const nanoOfDay = localTimeToNanoOfDay(
        value.getHour(),
        value.getMinute(),
        value.getSecond(),
        value.getNanosecond()
    );
    const offsetSeconds = Num.fromValue(value.getTimeZoneOffsetSeconds());
    const packableStructFields = [
        packer.packable(nanoOfDay),
        packer.packable(offsetSeconds)
    ];

    packer.packStruct(TIME, packableStructFields);
}

/**
 * Unpack time value using the given unpacker.
 * @param {Unpacker} unpacker the unpacker to use.
 * @param {number} structSize the retrieved struct size.
 * @param {BaseBuffer} buffer the buffer to unpack from.
 * @param {boolean} disableLosslessIntegers if integer properties in the result time should be native JS numbers.
 * @return {Time} the unpacked time value.
 */
export function unpackTime(
    unpacker: Unpacker,
    structSize: number,
    buffer: BaseBuffer,
    // @ts-ignore
    disableLosslessIntegers: boolean
): TimeMonad {
    unpacker.verifyStructSize('Time', TIME_STRUCT_SIZE, structSize);

    const nanoOfDay = unpacker.unpackIntegerBuffer(buffer);
    const offsetSeconds = unpacker.unpackIntegerBuffer(buffer);
    const localTime = nanoOfDayToLocalTime(nanoOfDay);
    const result = TimeMonad.of({
        hour: localTime.getHour(),
        minute: localTime.getMinute(),
        second: localTime.getSecond(),
        nanosecond: localTime.getNanosecond(),
        timeZoneOffsetSeconds: offsetSeconds
    });

    return result;
    // @todo: wtf?
    // return convertIntegerPropsIfNeeded(result, disableLosslessIntegers);
}

/**
 * Pack given neo4j date.
 * @param {Date} value the date value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packDate(value: DateMonad, packer: Packer): void {
    const epochDay = dateToEpochDay(value.getYear(), value.getMonth(), value.getDay());
    const packableStructFields = [packer.packable(epochDay)];

    packer.packStruct(DATE, packableStructFields);
}

/**
 * Unpack neo4j date value using the given unpacker.
 * @param {Unpacker} unpacker the unpacker to use.
 * @param {number} structSize the retrieved struct size.
 * @param {BaseBuffer} buffer the buffer to unpack from.
 * @param {boolean} disableLosslessIntegers if integer properties in the result date should be native JS numbers.
 * @return {Date} the unpacked neo4j date value.
 */
export function unpackDate(
    unpacker: Unpacker,
    structSize: number,
    buffer: BaseBuffer,
    // @ts-ignore
    disableLosslessIntegers: boolean
): DateMonad {
    unpacker.verifyStructSize('Date', DATE_STRUCT_SIZE, structSize);

    const epochDay = unpacker.unpackIntegerBuffer(buffer);
    const result = epochDayToDate(epochDay);

    return result;
    // @todo: wtf?
    // return convertIntegerPropsIfNeeded(result, disableLosslessIntegers);
}

/**
 * Pack given local date time.
 * @param {LocalDateTime} value the local date time value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packLocalDateTime(value: LocalDateTime, packer: Packer): void {
    const epochSecond = localDateTimeToEpochSecond(
        value.getYear(),
        value.getMonth(),
        value.getDay(),
        value.getHour(),
        value.getMinute(),
        value.getSecond(),
        // value.getNanosecond() @todo: ???
    );
    const nano = Num.fromValue(value.getNanosecond());
    const packableStructFields = [
        packer.packable(epochSecond),
        packer.packable(nano)
    ];

    packer.packStruct(LOCAL_DATE_TIME, packableStructFields);
}

/**
 * Unpack local date time value using the given unpacker.
 * @param {Unpacker} unpacker the unpacker to use.
 * @param {number} structSize the retrieved struct size.
 * @param {BaseBuffer} buffer the buffer to unpack from.
 * @param {boolean} disableLosslessIntegers if integer properties in the result local date-time should be native JS numbers.
 * @return {LocalDateTime} the unpacked local date time value.
 */
export function unpackLocalDateTime(
    unpacker: Unpacker,
    structSize: number,
    buffer: BaseBuffer,
    // @ts-ignore
    disableLosslessIntegers: boolean
): LocalDateTime {
    unpacker.verifyStructSize(
        'LocalDateTime',
        LOCAL_DATE_TIME_STRUCT_SIZE,
        structSize
    );

    const epochSecond = unpacker.unpackIntegerBuffer(buffer);
    const nano = unpacker.unpackIntegerBuffer(buffer);
    const result = epochSecondAndNanoToLocalDateTime(epochSecond, nano);

    return result;
    // @todo: wtf?
    // return convertIntegerPropsIfNeeded(result, disableLosslessIntegers);
}

/**
 * Pack given date time.
 * @param {DateTime} value the date time value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packDateTime(value: DateTime, packer: Packer): void {
    const zoneId = value.getTimeZoneId();

    if (!None.isNone(zoneId)) {
        packDateTimeWithZoneId(value, packer);
    } else {
        packDateTimeWithZoneOffset(value, packer);
    }
}

/**
 * Pack given date time with zone offset.
 * @param {DateTime} value the date time value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packDateTimeWithZoneOffset(value: DateTime, packer: Packer): void {
    const epochSecond = localDateTimeToEpochSecond(
        value.getYear(),
        value.getMonth(),
        value.getDay(),
        value.getHour(),
        value.getMinute(),
        value.getSecond(),
        // value.getNanosecond() // @todo: ???
    );
    const nano = Num.fromValue(value.getNanosecond());
    const timeZoneOffsetSeconds = Num.fromValue(value.getTimeZoneOffsetSeconds());
    const packableStructFields = [
        packer.packable(epochSecond),
        packer.packable(nano),
        packer.packable(timeZoneOffsetSeconds)
    ];

    packer.packStruct(DATE_TIME_WITH_ZONE_OFFSET, packableStructFields);
}

/**
 * Unpack date time with zone offset value using the given unpacker.
 * @param {Unpacker} unpacker the unpacker to use.
 * @param {number} structSize the retrieved struct size.
 * @param {BaseBuffer} buffer the buffer to unpack from.
 * @param {boolean} disableLosslessIntegers if integer properties in the result date-time should be native JS numbers.
 * @return {DateTime} the unpacked date time with zone offset value.
 */
export function unpackDateTimeWithZoneOffset(
    unpacker: Unpacker,
    structSize: number,
    buffer: BaseBuffer,
    // @ts-ignore
    disableLosslessIntegers: boolean
): DateTime {
    unpacker.verifyStructSize(
        'DateTimeWithZoneOffset',
        DATE_TIME_WITH_ZONE_OFFSET_STRUCT_SIZE,
        structSize
    );

    const epochSecond = unpacker.unpackIntegerBuffer(buffer);
    const nano = unpacker.unpackIntegerBuffer(buffer);
    const timeZoneOffsetSeconds = unpacker.unpackIntegerBuffer(buffer);
    const localDateTime = epochSecondAndNanoToLocalDateTime(epochSecond, nano);
    const result = DateTime.of({
        year: localDateTime.getYear(),
        month: localDateTime.getMonth(),
        day: localDateTime.getDay(),
        hour: localDateTime.getHour(),
        minute: localDateTime.getMinute(),
        second: localDateTime.getSecond(),
        nanosecond: localDateTime.getNanosecond(),
        timeZoneOffsetSeconds,
        timezoneId: null
    });

    return result;
    // @todo: wtf?
    // return convertIntegerPropsIfNeeded(result, disableLosslessIntegers);
}

/**
 * Pack given date time with zone id.
 * @param {DateTime} value the date time value to pack.
 * @param {Packer} packer the packer to use.
 */
export function packDateTimeWithZoneId(value: DateTime, packer: Packer): void {
    const epochSecond = localDateTimeToEpochSecond(
        value.getYear(),
        value.getMonth(),
        value.getDay(),
        value.getHour(),
        value.getMinute(),
        value.getSecond(),
        // value.getNanosecond() // @todo: ???
    );
    const nano = Num.fromValue(value.getNanosecond());
    const timeZoneId = value.getTimeZoneId();
    const packableStructFields = [
        packer.packable(epochSecond),
        packer.packable(nano),
        packer.packable(timeZoneId)
    ];

    packer.packStruct(DATE_TIME_WITH_ZONE_ID, packableStructFields);
}

/**
 * Unpack date time with zone id value using the given unpacker.
 * @param {Unpacker} unpacker the unpacker to use.
 * @param {number} structSize the retrieved struct size.
 * @param {BaseBuffer} buffer the buffer to unpack from.
 * @param {boolean} disableLosslessIntegers if integer properties in the result date-time should be native JS numbers.
 * @return {DateTime} the unpacked date time with zone id value.
 */
export function unpackDateTimeWithZoneId(
    unpacker: Unpacker,
    structSize: number,
    buffer: BaseBuffer,
    // @ts-ignore
    disableLosslessIntegers: boolean
): DateTime {
    unpacker.verifyStructSize(
        'DateTimeWithZoneId',
        DATE_TIME_WITH_ZONE_ID_STRUCT_SIZE,
        structSize
    );

    const epochSecond = unpacker.unpackIntegerBuffer(buffer);
    const nano = unpacker.unpackIntegerBuffer(buffer);
    const timeZoneId = unpacker.unpack(buffer);
    const localDateTime = epochSecondAndNanoToLocalDateTime(epochSecond, nano);
    const result = DateTime.of({
        year: localDateTime.getYear(),
        month: localDateTime.getMonth(),
        day: localDateTime.getDay(),
        hour: localDateTime.getHour(),
        minute: localDateTime.getMinute(),
        second: localDateTime.getSecond(),
        nanosecond: localDateTime.getNanosecond(),
        timeZoneOffsetSeconds: null,
        timeZoneId
    });

    return result;
    // @todo: wtf?
    // return convertIntegerPropsIfNeeded(result, disableLosslessIntegers);
}
