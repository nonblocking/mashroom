/* eslint-disable no-invalid-this */

// @flow

import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';

function equalsHelper(lvalue: any, rvalue: any, options: any) {
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

export default {
    'equals': equalsHelper,
    'year': year,
};

export const i18nHelper = (i18nService: MashroomI18NService, lang: string) => {
    return function i18n(key: string) {
        return i18nService.getMessage(key, lang);
    };
};
