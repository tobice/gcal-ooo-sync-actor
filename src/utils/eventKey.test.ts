import { eventKey } from './eventKey.js';
import { EventBuilder } from '../../test/utils/EventBuilder.js';

describe('eventKey', () => {
    it('generates a key for a normal event', () => {
        const event = new EventBuilder('Company All-Hands')
            .on('2024-02-05')
            .from('16:00')
            .to('17:00')
            .toEvent();

        const key = eventKey(event);
        expect(key).toBe('2024-02-05T16:00:00+01:00-2024-02-05T17:00:00+01:00-Company All-Hands');
    });

    it('generates a key for a multi-day event', () => {
        const event = new EventBuilder('Offsite')
            .from('2024-02-05')
            .to('2024-02-07')
            .toEvent();

        const key = eventKey(event);
        expect(key).toBe('2024-02-05-2024-02-08-Offsite'); // End date is exclusive
    });
});
