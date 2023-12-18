
// Stolen from Node.js source code: https://github.com/nodejs/node/blob/main/lib/_http_common.js#L216
const INVALID_HEADER_CHAR_REGEX = /[^\\t\x20-\x7e\x80-\xff]/g;

export const escapeHeaderValue = (header: string) => {
    return header
        .replace(INVALID_HEADER_CHAR_REGEX, '');
};

