export function checkStringNotEmpty(value: unknown, label = 'value'): string {
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`${label} must be a non-empty string`);
    }

    return value;
}

export function checkValidEmailAddress(value: string, label = 'value'): string {
    if (!/^[^@]+@[^@]+$/.test(value)) {
        throw new Error(`${label} must be a valid email address`);
    }

    return value;
}
