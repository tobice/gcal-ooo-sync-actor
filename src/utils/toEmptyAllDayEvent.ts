import { calendar_v3 } from 'googleapis';
import Schema$Event = calendar_v3.Schema$Event;
import { convertToDayjsWithUTCOffset } from './convertToDayjsWithUTCOffset.js';

/** Converts an event to an all-day event and strips all other information. */
export function toEmptyAllDayEvent({ summary, start, end }: Schema$Event): Schema$Event {
    // All-day events are kept as they are
    if (start?.date && end?.date) {
        return { summary, start, end };
    }

    // Normal events are converted to all-day events
    if (start?.dateTime && end?.dateTime) {
        const startTime = convertToDayjsWithUTCOffset(start.dateTime);
        const endTime = convertToDayjsWithUTCOffset(end.dateTime);

        return {
            summary,
            start: { date: startTime.format('YYYY-MM-DD') },
            end: {
                // End date is exclusive, so we need to adjust unless the event ends at midnight
                date: endTime.format('HH:mm') === '00:00'
                    ? endTime.format('YYYY-MM-DD')
                    : endTime.add(1, 'day').format('YYYY-MM-DD')
            }
        };
    }

    throw new Error('Invalid event');
}
