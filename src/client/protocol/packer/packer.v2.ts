import {Packer as PackerV1, Unpacker as UnpackerV1} from './packer.v1';
import {DateMonad, DateTime, Duration, LocalDateTime, LocalTime, Point, TimeMonad} from '../../../monads/index';
import BaseBuffer from '../../buffers/base.buffer';
import {
    DATE,
    DATE_TIME_WITH_ZONE_ID,
    DATE_TIME_WITH_ZONE_OFFSET,
    DURATION,
    LOCAL_DATE_TIME,
    LOCAL_TIME,
    POINT_2D,
    POINT_3D,
    TIME
} from './packer.constants';
import {
    packDate,
    packDateTime,
    packDuration,
    packLocalDateTime,
    packLocalTime,
    packPoint,
    packTime,
    unpackDate,
    unpackDateTimeWithZoneId,
    unpackDateTimeWithZoneOffset,
    unpackDuration,
    unpackLocalDateTime,
    unpackLocalTime,
    unpackPoint2D,
    unpackPoint3D, unpackTime
} from './packer.v2.utils';

export class Packer extends PackerV1 {
    disableByteArrays() {
        throw new Error('Bolt V2 should always support byte arrays');
    }

    packable(obj: any) {
        if (Point.isPoint(obj)) {
            return () => packPoint(obj, this);
        }

        if (Duration.isDuration(obj)) {
            return () => packDuration(obj, this);
        }

        if (LocalTime.isLocalTime(obj)) {
            return () => packLocalTime(obj, this);
        }

        if (TimeMonad.isTimeMonad(obj)) {
            return () => packTime(obj, this);
        }

        if (DateMonad.isDateMonad(obj)) {
            return () => packDate(obj, this);
        }

        if (LocalDateTime.isLocalDateTime(obj)) {
            return () => packLocalDateTime(obj, this);
        }

        if (DateTime.isDateTime(obj)) {
            return () => packDateTime(obj, this);
        }

        return super.packable(obj);
    }
}

export class Unpacker extends UnpackerV1 {
    unpackUnknownStruct(signature: number, structSize: number, buffer: BaseBuffer): any {
        if (signature === POINT_2D) {
            return unpackPoint2D(this, structSize, buffer);
        }

        if (signature === POINT_3D) {
            return unpackPoint3D(this, structSize, buffer);
        }

        if (signature === DURATION) {
            return unpackDuration(this, structSize, buffer);
        }

        if (signature === LOCAL_TIME) {
            return unpackLocalTime(
                this,
                structSize,
                buffer,
                this.disableLosslessIntegers
            );
        }

        if (signature === TIME) {
            return unpackTime(this, structSize, buffer, this.disableLosslessIntegers);
        }

        if (signature === DATE) {
            return unpackDate(this, structSize, buffer, this.disableLosslessIntegers);
        }

        if (signature === LOCAL_DATE_TIME) {
            return unpackLocalDateTime(
                this,
                structSize,
                buffer,
                this.disableLosslessIntegers
            );
        }

        if (signature === DATE_TIME_WITH_ZONE_OFFSET) {
            return unpackDateTimeWithZoneOffset(
                this,
                structSize,
                buffer,
                this.disableLosslessIntegers
            );
        }

        if (signature === DATE_TIME_WITH_ZONE_ID) {
            return unpackDateTimeWithZoneId(
                this,
                structSize,
                buffer,
                this.disableLosslessIntegers
            );
        }

        return super.unpackUnknownStruct(
            signature,
            structSize,
            buffer
        );
    }
}
