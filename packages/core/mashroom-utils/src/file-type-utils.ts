
const HASH_REGEX = /^[a-z0-9]{8,}$/g;
const ANY_DIGIT_REGEX = /\d/g;

export const isJavaScriptFile = (path: string) => {
    const pathWithoutQuery = path.split('?')[0];
    return pathWithoutQuery.endsWith('.js') || pathWithoutQuery.endsWith('.mjs');
};

export const isES6Module = (path: string) => {
    const pathWithoutQuery = path.split('?')[0];
    return pathWithoutQuery.endsWith('.mjs') || pathWithoutQuery.endsWith('.mts');
};

export const isChunkWithHash = (path: string) => {
    const pathWithoutQuery = path.split('?')[0];
    if (!isJavaScriptFile(path)) {
        return false;
    }
    const parts = pathWithoutQuery.split(/[-_.[\]]/g);
    if (parts.length < 3) {
        return false;
    }
    return parts.some((p) => {
        return p.match(HASH_REGEX) && p.match(ANY_DIGIT_REGEX);
    });
};

export const isTypescript = (path: string) => {
    const pathWithoutQuery = path.split('?')[0];
    return pathWithoutQuery.endsWith('.ts') || pathWithoutQuery.endsWith('.mts');
};
