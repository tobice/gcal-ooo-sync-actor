import { EventBuilder } from './EventBuilder.js';
import dayjs from 'dayjs';

describe('EventBuilder', () => {
    describe('when using full dates', () => {
        function createEvent(summary = 'Test event') {
            return new EventBuilder(summary, dayjs().format('YYYY-MM-DD'), 'Europe/Prague');
        }

        it('creates an event', () => {
            const event = createEvent()
                .on('2024-02-05')
                .from('09:00')
                .to('10:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T09:00:00+01:00');
            expect(event.end?.dateTime).toBe('2024-02-05T10:00:00+01:00');
        });

        it('creates an all-day event', () => {
            const event = createEvent()
                .on('2024-02-05')
                .toEvent();

            expect(event.start?.date).toBe('2024-02-05');
            expect(event.end?.date).toBe('2024-02-06'); // End date is exclusive
        });

        it('creates an all-day multi-day event', () => {
            const event = createEvent()
                .from('2024-02-05')
                .to('2024-02-10')
                .toEvent();

            expect(event.start?.date).toBe('2024-02-05');
            expect(event.end?.date).toBe('2024-02-11'); // End date is exclusive
        });

        it('creates an event over midnight', () => {
            const event = createEvent()
                .on('2024-02-05')
                .from('16:00')
                .to('02:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T16:00:00+01:00');
            expect(event.end?.dateTime).toBe('2024-02-06T02:00:00+01:00');
        });

        it('creates a multi-day event with specific times', () => {
            const event = createEvent()
                .from('2024-02-05', '16:00')
                .to('2024-02-07', '02:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T16:00:00+01:00');
            expect(event.end?.dateTime).toBe('2024-02-07T02:00:00+01:00');
        });
    });

    describe('when today is Monday', () => {
        function createEvent(summary: string = 'Test event') {
            const TODAY = '2024-02-05'; // Monday
            return new EventBuilder(summary, TODAY);
        }

        it('creates an event with the right summary', () => {
            const event = createEvent('Company All-Hands')
                .on('Monday')
                .toEvent();

            expect(event.summary).toBe('Company All-Hands');
        });

        it('creates an event today', () => {
            const event = createEvent()
                .from('09:00')
                .to('10:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T09:00:00+01:00');
            expect(event.end?.dateTime).toBe('2024-02-05T10:00:00+01:00');
        });

        it('creates an event tomorrow', () => {
            const event = createEvent()
                .on('Tuesday')
                .from('09:00')
                .to('10:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-06T09:00:00+01:00');
            expect(event.end?.dateTime).toBe('2024-02-06T10:00:00+01:00');
        });

        it('creates an all-day event', () => {
            const event = createEvent()
                .on('Monday')
                .toEvent();

            expect(event.start?.date).toBe('2024-02-05');
            expect(event.end?.date).toBe('2024-02-06'); // End date is exclusive
        });

        it('creates an all-day multi-day event', () => {
            const event = createEvent()
                .from('Monday')
                .to('Saturday')
                .toEvent();

            expect(event.start?.date).toBe('2024-02-05');
            expect(event.end?.date).toBe('2024-02-11'); // End date is exclusive
        });

        it('creates an event over midnight', () => {
            const event = createEvent()
                .on('Monday')
                .from('16:00')
                .to('02:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T16:00:00+01:00');
            expect(event.end?.dateTime).toBe('2024-02-06T02:00:00+01:00');
        });

        it('creates a multi-day event with specific times', () => {
            const event = createEvent()
                .from('Monday', '16:00')
                .to('Wednesday', '02:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T16:00:00+01:00');
            expect(event.end?.dateTime).toBe('2024-02-07T02:00:00+01:00');
        });

        it('creates a multi-day event spanning into the next week', () => {
            const event = createEvent()
                .from('Monday', '16:00')
                .to('Wednesday', '02:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T16:00:00+01:00');
            expect(event.end?.dateTime).toBe('2024-02-07T02:00:00+01:00');
        });
    });

    describe('when today is Saturday', () => {
        function createEvent(summary: string = 'Test event') {
            const TODAY = '2024-02-10'; // Saturday
            return new EventBuilder(summary, TODAY);
        }

        it('creates an event today', () => {
            const event = createEvent()
                .on('Saturday')
                .toEvent();

            expect(event.start?.date).toBe('2024-02-10');
            expect(event.end?.date).toBe('2024-02-11'); // End date is exclusive
        });

        it('creates an event next week', () => {
            const event = createEvent()
                .on('Monday')
                .toEvent();

            expect(event.start?.date).toBe('2024-02-12');
            expect(event.end?.date).toBe('2024-02-13'); // End date is exclusive
        });

        it('creates a multi-day event spanning into the next week', () => {
            const event = createEvent()
                .from('Saturday')
                .to('Monday')
                .toEvent();

            expect(event.start?.date).toBe('2024-02-10');
            expect(event.end?.date).toBe('2024-02-13'); // End date is exclusive
        });
    });

    describe('when the input is invalid', () => {
        it('throws if "today" is invalid', () => {
            expect(() => new EventBuilder('Test event', 'not-a-valid-date')).toThrow();
        });

        it('throws if from() gets an invalid value', () => {
            expect(() => new EventBuilder()
                .from('Mittwoch')
                .toEvent()).toThrow();
        });

        it('throws if to() gets an invalid value', () => {
            expect(() => new EventBuilder()
                .to('Mittwoch')
                .toEvent()).toThrow();
        });

        it('throws if on() gets an invalid value', () => {
            expect(() => new EventBuilder()
                .on('not-a-valid-date')
                .toEvent()).toThrow();
        });
    });
});
