import { EventBuilder } from './EventBuilder.js';

describe('EventBuilder', () => {
    describe('when using full dates', () => {
        it('creates an event', () => {
            const event = new EventBuilder()
                .on('2024-02-05')
                .from('09:00')
                .to('10:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T09:00:00.000Z');
            expect(event.end?.dateTime).toBe('2024-02-05T10:00:00.000Z');
        });

        it('creates an all-day event', () => {
            const event = new EventBuilder()
                .on('2024-02-05')
                .toEvent();

            expect(event.start?.date).toBe('2024-02-05');
            expect(event.end?.date).toBe('2024-02-06'); // End date is exclusive
        });

        it('creates an all-day multi-day event', () => {
            const event = new EventBuilder()
                .from('2024-02-05')
                .to('2024-02-10')
                .toEvent();

            expect(event.start?.date).toBe('2024-02-05');
            expect(event.end?.date).toBe('2024-02-11'); // End date is exclusive
        });

        it('creates an event over midnight', () => {
            const event = new EventBuilder()
                .on('2024-02-05')
                .from('16:00')
                .to('02:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T16:00:00.000Z');
            expect(event.end?.dateTime).toBe('2024-02-06T02:00:00.000Z');
        });

        it('creates a multi-day event with specific times', () => {
            const event = new EventBuilder()
                .from('2024-02-05', '16:00')
                .to('2024-02-07', '02:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T16:00:00.000Z');
            expect(event.end?.dateTime).toBe('2024-02-07T02:00:00.000Z');
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

            expect(event.start?.dateTime).toBe('2024-02-05T09:00:00.000Z');
            expect(event.end?.dateTime).toBe('2024-02-05T10:00:00.000Z');
        });

        it('creates an event tomorrow', () => {
            const event = createEvent()
                .on('Tuesday')
                .from('09:00')
                .to('10:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-06T09:00:00.000Z');
            expect(event.end?.dateTime).toBe('2024-02-06T10:00:00.000Z');
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

            expect(event.start?.dateTime).toBe('2024-02-05T16:00:00.000Z');
            expect(event.end?.dateTime).toBe('2024-02-06T02:00:00.000Z');
        });

        it('creates a multi-day event with specific times', () => {
            const event = createEvent()
                .from('Monday', '16:00')
                .to('Wednesday', '02:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T16:00:00.000Z');
            expect(event.end?.dateTime).toBe('2024-02-07T02:00:00.000Z');
        });

        it('creates a multi-day event spanning into the next week', () => {
            const event = createEvent()
                .from('Monday', '16:00')
                .to('Wednesday', '02:00')
                .toEvent();

            expect(event.start?.dateTime).toBe('2024-02-05T16:00:00.000Z');
            expect(event.end?.dateTime).toBe('2024-02-07T02:00:00.000Z');
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
});
