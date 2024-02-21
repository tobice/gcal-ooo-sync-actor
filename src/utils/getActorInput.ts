import { Actor } from 'apify';

interface KeyValue {
    key: string,
    value: string
}

interface ActorInput {
    sourceCalendarIds: string[],
    targetCalendarId: string,
    displayNameOverrides: KeyValue[],
    daysToSync: number
}

export async function getActorInput(): Promise<ActorInput> {
    const input = await Actor.getInput<ActorInput>();

    if (!input) {
        throw new Error('INPUT not provided')
    }

    // TODO: Explicitly validate the input (is it necessary, though?)

    return input;
}
