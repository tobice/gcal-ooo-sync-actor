import { toEmptyAllDayEvent } from './toEmptyAllDayEvent.js';
import { EventBuilder } from '../../test/utils/EventBuilder.js';

describe('toEmptyAllDayEvent', () => {
    it('converts a normal event to an all-day event', () => {
        const event = toEmptyAllDayEvent(
            new EventBuilder()
                .on('2024-02-05')
                .from('10:00')
                .to('11:00')
                .toEvent());

        expect(event.start?.date).toBe('2024-02-05');
        expect(event.end?.date).toBe('2024-02-06'); // End date is exclusive
    });

    it('keeps an all-day event as is', () => {
        const event = toEmptyAllDayEvent(
            new EventBuilder()
                .on('2024-02-05')
                .toEvent());

        expect(event.start?.date).toBe('2024-02-05');
        expect(event.end?.date).toBe('2024-02-06'); // End date is exclusive
    });

    it('keeps an all-day event with explicit start/end time as is', () => {
        // Some all-day events have a specific start/end time
        const event = toEmptyAllDayEvent(
            new EventBuilder()
                .from('2024-02-05', '00:00')
                .to('2024-02-06', '00:00')
                .toEvent());

        expect(event.start?.date).toBe('2024-02-05');
        expect(event.end?.date).toBe('2024-02-06');
    });

    it('converts a multi-day event with specific start/end time to a multi-day all-day event', () => {
        const event = toEmptyAllDayEvent(
            new EventBuilder()
                .from('2024-02-05', '16:00')
                .to('2024-02-07', '02:00')
                .toEvent());

        expect(event.start?.date).toBe('2024-02-05');
        expect(event.end?.date).toBe('2024-02-08'); // End date is exclusive
    });

    it('keeps a multi-day all-day event as is', () => {
        const event = toEmptyAllDayEvent(
            new EventBuilder()
                .from('2024-02-05')
                .to('2024-02-10')
                .toEvent());

        expect(event.start?.date).toBe('2024-02-05');
        expect(event.end?.date).toBe('2024-02-11'); // End date is exclusive
    });

    it('strips all other information from the event', () => {
        const event = {
            summary: 'Test event',
            start: { dateTime: '2024-02-05T10:00:00.000Z' },
            end: { dateTime: '2024-02-05T11:00:00.000Z' },
            description: 'This is a test event',
            eventType: 'outOfOffice',
        };

        const emptyAllDayEvent = toEmptyAllDayEvent(event);

        expect(emptyAllDayEvent).toEqual({
            summary: 'Test event',
            start: { date: '2024-02-05' },
            end: { date: '2024-02-06' },
        });
    });
});
