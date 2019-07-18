// @flow

const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#x27;',
    '/': '&#x2F;'
};

export const escapeForRegExp = (input: string) => {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const escapeForHtml = (input: string) => {
    return input.replace(/[&<>"'/]/g, (match) => {
        return HTML_ESCAPES[match];
    });
};
