import ow from 'ow';

export const owCheck = (...params: Parameters<typeof ow>) => {
    ow(...params);
    return params[0];
};
