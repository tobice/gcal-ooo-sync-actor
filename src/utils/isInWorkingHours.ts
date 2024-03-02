import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;
import dayjs from '../utils/dayjs.js';
import { convertToDayjsWithUTCOffset } from './convertToDayjsWithUTCOffset.js';

export interface WorkingHours {
    /** The start of the working hours in the format "HH:MM", for example 09:00 */
    start: string;

    /** The end of the working hours in the format "HH:MM", for example 17:00 */
    end: string;
}

/**
 * Returns true if the event is on a workday and overlapping with the provided working hours.
 *
 * Working hours relative to the event time zone are used.
 */
export function isInWorkingHours(event: Schema$Event, workingHours: WorkingHours): boolean {
    // Unify start/end between all-day and non-all-day events.
    let start = event.start?.date ?
        dayjs(`${event.start.date}`).startOf('day') : // Treat all-day events as starting at the beginning of the day.
        convertToDayjsWithUTCOffset(event.start!.dateTime!);
    const end = event.end?.date ?
        dayjs(`${event.end.date}`).startOf('day') : // Treat all-day events as starting at the beginning of the day.
        convertToDayjsWithUTCOffset(event.end!.dateTime!);

    function _isWorkingDay(date: dayjs.Dayjs) {
        return [0 /* = Sunday */, 6 /* = Saturday */].includes(date.day());
    }

    function _isInWorkingHours(start: dayjs.Dayjs) {
        if (_isWorkingDay(start)) {
            return false;
        }

        return start.format('HH:mm') >= workingHours.start && start.format('HH:mm') < workingHours.end;
    }

    const [hours, minutes] = workingHours.start.split(':').map(x => parseInt(x));

    function _getNextWorkStart(current: dayjs.Dayjs) {
        let next = current.startOf('day');

        // Move to the next day if work is already over, or we're on a weekend.
        if (current.format('HH:mm') >= workingHours.end || _isWorkingDay(current)) {
            next = next.add(1, 'day');
        }

        // Reset to the beginning to the working hours.
        return next.hour(hours).minute(minutes);
    }

    // Move forward the beginning of the event until we reach working hours, or the end of the event. There probably is
    // a sophisticated O(1) solution consisting of a bunch of ifs, but this is easier to understand and maintain.
    while (start.isBefore(end) && !_isInWorkingHours(start)) {
        start = _getNextWorkStart(start);
    }

    return start.isBefore(end);
}
