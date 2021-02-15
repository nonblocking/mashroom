
const HTML_ESCAPES: Record<string, string> = {
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
