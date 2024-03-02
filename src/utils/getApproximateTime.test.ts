import { getApproximateTime } from './getApproximateTime.js';
import { EventBuilder } from '../../test/utils/EventBuilder.js';

describe('getApproximateTime', () => {
    it('returns morning for an event ending before 11:00', () => {
        const event = new EventBuilder()
            .from('09:00')
            .to('10:00')
            .toEvent();

        expect(getApproximateTime(event)).toBe('morning');
    });

    it('returns afternoon for an event starting after 13:00', () => {
        const event = new EventBuilder()
            .from('14:00')
            .to('15:00')
            .toEvent();

        expect(getApproximateTime(event)).toBe('afternoon');
    });

    it('returns lunch for an event starting after 11:00 and ending before 13:00', () => {
        const event = new EventBuilder()
            .from('11:30')
            .to('12:30')
            .toEvent();

        expect(getApproximateTime(event)).toBe('lunch');
    });

    it('returns empty string for a long event', () => {
        const event = new EventBuilder()
            .from('06:00')
            .to('11:00')
            .toEvent();

        expect(getApproximateTime(event)).toBe('');
    });

    it('returns empty string for an all-day event', () => {
        const event = new EventBuilder()
            .toEvent();

        expect(getApproximateTime(event)).toBe('');
    });
});
