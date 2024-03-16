import { Actor } from 'apify';

// Can't use more semantic property names as this format is enforced by Apify Input format.
interface KeyValue {
    key: string,
    value: string
}

export interface ActorInput {
    sourceCalendarIds: string[],
    targetCalendarId: string,
    displayNameOverrides: KeyValue[],
    daysToSync: number,
    workingHoursStart: string,
    workingHoursEnd: string
}

export async function getActorInput(): Promise<ActorInput> {
    const input = await Actor.getInput<ActorInput>();

    if (!input) {
        throw new Error('INPUT not provided')
    }

    return input;
}
