// @flow
/* eslint-disable no-invalid-this */

import context from './context';

import type {UserAgent} from '@mashroom/mashroom-portal/type-definitions';

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

function isIE(userAgent: UserAgent, options: any) {
    if (userAgent.browser.name && userAgent.browser.name.startsWith('IE')) {
        return options.fn(this);
    }
    return null;
}

function i18n(messages: (string) => string, key: string) {
    return messages(key) || key;
}

function env() {
    return process.env.NODE_ENV || 'development';
}

function mashroomVersion() {
    return context.mashroomVersion;
}

function ifShowEnvAndVersions(options: any) {
    if (context.showEnvAndVersions) {
        return options.fn(this);
    }
    return null;
}

export default {
    equals,
    year,
    isIE,
    env,
    mashroomVersion,
    ifShowEnvAndVersions,
    '__': i18n,
};
