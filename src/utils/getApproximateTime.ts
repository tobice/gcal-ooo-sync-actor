import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;
import { convertToDayjsWithUTCOffset } from './convertToDayjsWithUTCOffset.js';

export function getApproximateTimeSuffix(event: Schema$Event): string {
    const time = getApproximateTime(event);
    return time ? ` (${time})` : '';
}

export function getApproximateTime(event: Schema$Event): string {
    // Skip all-day events
    if (event.start?.date) {
        return '';
    }

    const start = convertToDayjsWithUTCOffset(event.start!.dateTime!);
    const end = convertToDayjsWithUTCOffset(event.end!.dateTime!);

    // Skip long events
    if (end.diff(start, 'hours') > 4) {
        return '';
    }

    const startTime = start.format('HH:mm');
    const endTime = end.format('HH:mm');

    if (endTime <= '12:00') {
        return 'morning';
    }

    if (startTime > '12:00') {
        return 'afternoon';
    }

    if (startTime >= '11:00' && endTime <= '13:00') {
        return 'lunch';
    }

    return '';
}
