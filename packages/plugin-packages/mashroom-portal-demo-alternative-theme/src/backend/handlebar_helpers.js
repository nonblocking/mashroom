/* eslint-disable no-invalid-this */

// @flow

function equals(lvalue: any, rvalue: any, options: any) {
    if (arguments.length < 3) {
        throw new Error('Handlebars Helper equal needs 2 parameters');
    }
    if (lvalue !== rvalue) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
}

function year() {
    return `<span>${new Date().getFullYear()}</span>`;
}

function i18n(messages: (string) => string, key: string) {
    return messages(key) || key;
}

export default {
    equals,
    year,
    '__': i18n,
};
