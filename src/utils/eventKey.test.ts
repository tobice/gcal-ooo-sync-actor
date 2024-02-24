import { eventKey } from './eventKey.js'; // Adjust the import path according to your project structure
import { calendar_v3 } from 'googleapis';

import Schema$Event = calendar_v3.Schema$Event;

describe('eventKey', () => {
    it('should generate the correct key for an event with dateTime', () => {
        const event: Schema$Event = {
            summary: 'Team Meeting',
            start: { dateTime: '2023-01-01T10:00:00Z' },
            end: { dateTime: '2023-01-01T11:00:00Z' },
        };

        const key = eventKey(event);
        expect(key).toBe('2023-01-01T10:00:00Z-2023-01-01T11:00:00Z-Team Meeting');
    });

    it('should generate the correct key for an event with date', () => {
        const event: Schema$Event = {
            summary: 'All Day Event',
            start: { date: '2023-01-02' },
            end: { date: '2023-01-03' },
        };

        const key = eventKey(event);
        expect(key).toBe('2023-01-02-2023-01-03-All Day Event');
    });

    it('should handle events without a summary', () => {
        const event: Schema$Event = {
            start: { dateTime: '2023-01-01T10:00:00Z' },
            end: { dateTime: '2023-01-01T11:00:00Z' },
        };

        const key = eventKey(event);
        expect(key).toBe('2023-01-01T10:00:00Z-2023-01-01T11:00:00Z-undefined');
    });
});
