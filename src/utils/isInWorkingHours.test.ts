import { isInWorkingHours } from './isInWorkingHours.js';
import { EventBuilder } from '../../test/utils/EventBuilder.js';

describe('isInWorkingHours', () => {
    describe('events with explicit start and end times', () => {
        it('returns true for an event that is completely within working hours', () => {
            const event = new EventBuilder()
                .on('Monday')
                .from('10:00')
                .to('11:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(true);
        });

        it('returns false for an event that is completely outside of working hours', () => {
            const event = new EventBuilder()
                .on('Monday')
                .from('07:00')
                .to('08:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(false);
        });

        it('returns false for an event that is just before working hours', () => {
            const event = new EventBuilder()
                .on('Monday')
                .from('08:00')
                .to('09:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(false);
        });

        it('returns false for an event that is just after working hours', () => {
            const event = new EventBuilder()
                .on('Monday')
                .from('17:00')
                .to('18:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(false);
        });

        it('returns true for an event that slightly overlaps', () => {
            const event = new EventBuilder()
                .on('Monday')
                .from('16:59')
                .to('18:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(true);
        });

        it('returns true for an event matching working hours exactly', () => {
            const event = new EventBuilder()
                .on('Monday')
                .from('09:00')
                .to('17:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(true);
        });

        it('return false for a working-hour event but on a weekend', () => {
            const event = new EventBuilder()
                .on('Saturday')
                .from('10:00')
                .to('11:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(false);
        });

        it('returns true for a multi-day event overlapping with working hours', () => {
            const event = new EventBuilder()
                .from('Monday', '18:00')
                .to('Wednesday', '02:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(true);
        });
    });

    describe('all-day events', () => {
        it('returns true for an all-day event on a workday', () => {
            const event = new EventBuilder()
                .on('Monday')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(true);
        });

        it('returns false for an all-day event on a weekend', () => {
            const event = new EventBuilder()
                .on('Saturday')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(false);
        });
    });

    describe('events in other timezone', () => {
        function createEvent() {
            return new EventBuilder('Test event', '2024-05-01', 'America/New_York');
        }

        it('returns false for an event that is just before working hours', () => {
            const event = createEvent()
                .on('Monday')
                .from('08:00')
                .to('09:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(false);
        });

        it('returns false for an event that is just after working hours', () => {
            const event = createEvent()
                .on('Monday')
                .from('17:00')
                .to('18:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(false);
        });

        it('returns true for an event matching working hours exactly', () => {
            const event = createEvent()
                .on('Monday')
                .from('09:00')
                .to('17:00')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(true);
        });

        it('returns false for an all-day event on a weekend', () => {
            const event = new EventBuilder()
                .on('Sunday')
                .toEvent();
            const workingHours = { start: '09:00', end: '17:00' };

            expect(isInWorkingHours(event, workingHours)).toBe(false);
        });
    });
});
