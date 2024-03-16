import { Actor, log } from 'apify';
import * as process from 'process';
import { getActorInput } from './utils/getActorInput.js';
import { createSyncService } from './SyncService.js';
import { checkStringNotEmpty } from './utils/check.js';
import { validateActorInput } from './utils/validateActorInput.js';

export async function runActor() {
    await Actor.init();

    const input = await getActorInput();
    log.info('Actor input', { input });

    try {
        validateActorInput(input);
    } catch (error: any) {
        throw new Error(`Invalid actor input: ${error.message}`);
    }

    const syncConfig = {
        daysToSync: input.daysToSync,
        workingHours: {
            start: input.workingHoursStart,
            end: input.workingHoursEnd
        }
    }

    const displayNameOverrides = new Map(input.displayNameOverrides.map(({ key, value }) => [key, value]));

    const credentials = {
        client_id: checkStringNotEmpty(process.env.OAUTH2_CLIENT_ID, 'OAUTH2_CLIENT_ID'),
        client_secret: checkStringNotEmpty(process.env.OAUTH2_CLIENT_SECRET, 'OAUTH2_CLIENT_SECRET'),
        redirect_uri: checkStringNotEmpty(process.env.OAUTH2_REDIRECT_URI, 'OAUTH2_REDIRECT_URI'),
    }

    const syncService = await createSyncService(credentials, syncConfig);

    for (const sourceCalendarId of input.sourceCalendarIds) {
        const displayName = displayNameOverrides.get(sourceCalendarId) ?? sourceCalendarId.split('@')[0];
        await syncService.sync(sourceCalendarId, input.targetCalendarId, displayName);
    }
}
