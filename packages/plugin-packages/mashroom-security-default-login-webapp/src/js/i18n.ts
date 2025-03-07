import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';

export default (i18nService: MashroomI18NService, lang: string) => {
    return function i18n(key: string) {
        return i18nService.getMessage(key, lang);
    };
};
