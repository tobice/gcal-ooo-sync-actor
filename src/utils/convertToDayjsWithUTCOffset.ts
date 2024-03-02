import dayjs from './dayjs.js';
import { log } from 'apify';

/**
 * Converts an RFC 3339 formatted string into a dayjs object.
 *
 * The conversion preserves the original timezone by explicitly setting the UTC offset (dayjs doesn't do that out of
 * the box). This is necessary for .format('HH:mm') to return local time that can be compared to working hours.
 */
export function convertToDayjsWithUTCOffset(dateTime: string): dayjs.Dayjs {
    let d = dayjs(dateTime);

    if (!d.isValid()) {
        throw new Error(`Invalid date-time string: ${dateTime}`);
    }

    const utcOffset = extractUTCOffset(dateTime);

    if (!utcOffset) {
        log.warning('Unable to extract UTC offset; detecting working hours might not work', { dateTime });
        return d;
    }

    return d.utcOffset(utcOffset);
}

function extractUTCOffset(dateTime: string) {
    const regex = /(Z|([+-])(\d{2}):?(\d{2}))/;
    const matches = dateTime.match(regex);

    if (matches) {
        // If 'Z', return it directly; otherwise, construct the offset string
        return matches[0] === 'Z' ? 'Z' : `${matches[2]}${matches[3]}:${matches[4]}`;
    } else {
        return null; // No offset found
    }
}
