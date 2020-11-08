/* eslint-disable no-invalid-this */

import themeParams from './theme_params';

import type {UserAgent} from '@mashroom/mashroom-portal/type-definitions';

function equals(this: any, lvalue: any, rvalue: any, options: any): any {
    if (arguments.length < 3) {
        throw new Error('Handlebars Helper equal needs 2 parameters');
    }
    if (lvalue !== rvalue) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
}

function i18n(messages: (key: string) => string, key: string): string {
    return messages(key) || key;
}

function env(): string {
    return process.env.NODE_ENV || 'development';
}

function mashroomVersion(): string {
    return themeParams.mashroomVersion;
}

function ifShowEnvAndVersions(this: any, options: any): any {
    if (themeParams.showEnvAndVersions) {
        return options.fn(this);
    }
    return null;
}

export default {
    equals,
    env,
    mashroomVersion,
    ifShowEnvAndVersions,
    '__': i18n,
};
