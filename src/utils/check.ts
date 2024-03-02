export function checkStringNotEmpty(value: unknown, label = 'value'): string {
    if (typeof value !== 'string' || value.length === 0) {
        throw new Error(`${label} must be a non-empty string`);
    }

    return value;
}
