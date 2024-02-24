import { eventKey } from './eventKey.js';
import { EventBuilder } from '../../test/utils/EventBuilder.js';

describe('eventKey', () => {
    function createEvent(summary: string) {
        const TODAY = '2024-02-05'; // Monday
        return new EventBuilder(TODAY, summary);
    }

    it('generates a key for a normal event', () => {
        const event = createEvent('Company All-Hands')
            .on('Monday')
            .from('16:00')
            .to('17:00')
            .toEvent();

        const key = eventKey(event);
        expect(key).toBe('2024-02-05T16:00:00.000Z-2024-02-05T17:00:00.000Z-Company All-Hands');
    });

    it('generates a key for a multi-day event', () => {
        const event = createEvent('Offsite')
            .from('Monday')
            .to('Wednesday')
            .toEvent();

        const key = eventKey(event);
        expect(key).toBe('2024-02-05-2024-02-08-Offsite'); // End date is exclusive
    });
});
