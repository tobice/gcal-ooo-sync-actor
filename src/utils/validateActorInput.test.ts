import { validateActorInput } from './validateActorInput.js';

const VALID_INPUT = {
    "displayNameOverrides": [
        {
            "key": "adam.good@apify.com",
            "value": "Adam"
        }
    ],
    "sourceCalendarIds": [
        "adam.good@apify.com"
    ],
    "targetCalendarId": "vacations@group.calendar.google.com",
    "daysToSync": 60,
    "workingHoursStart": "09:00",
    "workingHoursEnd": "16:00"
}

describe('validateActorInput', () => {
    it('should not fail for a valid input', () => {
        expect(() => validateActorInput(VALID_INPUT)).not.toThrow();
    });

    it('should fail for an empty sourceCalendarIds', () => {
        const input = { ...VALID_INPUT, sourceCalendarIds: [] };
        expect(() => validateActorInput(input)).toThrow('Source calendar IDs must not be empty');
    });

    it('should fail for an invalid sourceCalendarId', () => {
        const input = { ...VALID_INPUT, sourceCalendarIds: ['invalid_email'] };
        expect(() => validateActorInput(input)).toThrow('Source calendar ID must be a valid email address');
    });

    it('should fail for an invalid targetCalendarId', () => {
        const input = { ...VALID_INPUT, targetCalendarId: 'invalid_email' };
        expect(() => validateActorInput(input)).toThrow('Target calendar ID must be a valid email address');
    });

    it('should fail for a duplicate displayNameOverrides.key', () => {
        const input = {
            ...VALID_INPUT,
            displayNameOverrides: [
                { key: 'adam.good@apify.com', value: 'Adam' },
                { key: 'adam.good@apify.com', value: 'Jane' }
            ]
        };
        expect(() => validateActorInput(input))
            .toThrow('Duplicate calendar ID in display name overrides, duplicate: adam.good@apify.com');
    });

    it('should fail for a duplicate displayNameOverrides.value', () => {
        const input = {
            ...VALID_INPUT,
            displayNameOverrides: [
                { key: 'adam.good@apify.com', value: 'Adam' },
                { key: 'jane.honda@apify.com', value: 'Adam' }
            ]
        };
        expect(() => validateActorInput(input))
            .toThrow('Duplicate override in display name overrides, duplicate: Adam');
    });

    it('should fail for an invalid daysToSync', () => {
        const input = { ...VALID_INPUT, daysToSync: 0 };
        expect(() => validateActorInput(input)).toThrow('The number of days to sync must be a positive integer');
    });

    it('should fail for an invalid workingHoursStart', () => {
        const input = { ...VALID_INPUT, workingHoursStart: 'invalid_time' };
        expect(() => validateActorInput(input)).toThrow('Working hours start must be in HH:mm format');
    });

    it('should fail for an invalid workingHoursEnd', () => {
        const input = { ...VALID_INPUT, workingHoursEnd: 'invalid_time' };
        expect(() => validateActorInput(input)).toThrow('Working hours end must be in HH:mm format');
    });

    it('should fail for workingHoursStart >= workingHoursEnd', () => {
        const input = { ...VALID_INPUT, workingHoursStart: '16:00', workingHoursEnd: '09:00' };
        expect(() => validateActorInput(input)).toThrow('Working hours must start before they end');
    });
});
