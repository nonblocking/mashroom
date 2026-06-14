import type {MashroomPluginContext, I18NString} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';

// eslint-disable-next-line import/prefer-default-export
export const serializeI18NString = (i18nString: I18NString | null | undefined, pluginContext: MashroomPluginContext) => {
    if (!i18nString) {
        return '';
    }
    if (typeof i18nString === 'string') {
        return i18nString;
    }

    const i18nService: MashroomI18NService = pluginContext.services.i18n!.service;
    const defaultLanguage = i18nService.defaultLanguage;

    const defaultMessageKey = i18nString[defaultLanguage] ? defaultLanguage : Object.keys(i18nString)[0];
    const defaultMessage = i18nString[defaultMessageKey];
    const translations = Object.keys(i18nString)
        .filter((lang) => lang !== defaultLanguage)
        .map((lang) => `${lang}: ${i18nString[lang]}`)
        .join(', ');

    return `${defaultMessage} (translations: ${translations})`;
};
