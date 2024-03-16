import { ActorInput } from './getActorInput.js';
import { checkValidEmailAddress, checkStringNotEmpty } from './check.js';

export function validateActorInput(actorInput: ActorInput) {
    // Validate calendar IDs
    if (!Array.isArray(actorInput.sourceCalendarIds) || actorInput.sourceCalendarIds.length === 0) {
        throw new Error('Source calendar IDs must not be empty');
    }
    actorInput.sourceCalendarIds.forEach((id) => checkValidEmailAddress(id, 'Source calendar ID'));
    checkValidEmailAddress(actorInput.targetCalendarId, 'Target calendar ID');

    // Validate display name overrides
    const keys = new Set<string>();
    const values = new Set<string>();
    actorInput.displayNameOverrides.forEach(({ key, value }) => {
        checkValidEmailAddress(key, 'Calendar ID in display name overrides');
        checkStringNotEmpty(value, 'Override in display name overrides');

        // ':' is used as a separator in the event name, so it must not be used in the override
        if (value.includes(':')) {
            throw new Error(`Override in display name overrides must not contain a colon: ${value}`);
        }

        // Check for duplicates
        if (keys.has(key)) {
            throw new Error(`Duplicate calendar ID in display name overrides, duplicate: ${key}`);
        }
        keys.add(key);

        if (values.has(value)) {
            throw new Error(`Duplicate override in display name overrides, duplicate: ${value}`);
        }
        values.add(value);
    });

    // Validate the number of days to sync
    if (!Number.isInteger(actorInput.daysToSync) || actorInput.daysToSync <= 0) {
        throw new Error('The number of days to sync must be a positive integer');
    }

    // Working hours must have a valid HH:mm format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(actorInput.workingHoursStart)) {
        throw new Error('Working hours start must be in HH:mm format');
    }
    if (!timeRegex.test(actorInput.workingHoursEnd)) {
        throw new Error('Working hours end must be in HH:mm format');
    }
    if (actorInput.workingHoursStart >= actorInput.workingHoursEnd) {
        throw new Error('Working hours must start before they end');
    }
}
