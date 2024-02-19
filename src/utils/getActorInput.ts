import { Actor } from 'apify';

interface KeyValue {
    key: string,
    value: string
}

interface ActorInput {
    sourceCalendarIds: string[],
    targetCalendarId: string,
    displayNameOverrides: KeyValue[]
}

export async function getActorInput(): Promise<ActorInput> {
    const input = await Actor.getInput<ActorInput>();

    if (!input) {
        throw new Error('INPUT not provided')
    }

    return input;
}
