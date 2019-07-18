// @flow

import type {ExpressRequest, I18NString} from '@mashroom/mashroom/type-definitions';

export interface MashroomI18NService {
    /**
     * Get the currently set language (for current session)
     */
    getLanguage(req: ExpressRequest): string;
    /**
     * Set session language
     */
    setLanguage(language: string, req: ExpressRequest): void;
    /**
     * Get the message for given key and language
     */
    getMessage(key: string, language: string): string;
    /**
     * Get plain string in the current users language from a I18NString
     */
    translate(req: ExpressRequest, str: I18NString): string;
    /**
     * Get available languages
     */
    +availableLanguages: Array<string>;
    /**
     * Get the default languages
     */
    +defaultLanguage: string;
}
