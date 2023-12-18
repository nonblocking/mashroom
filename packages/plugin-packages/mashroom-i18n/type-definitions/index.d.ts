
import type {Request} from 'express';
import type {I18NString} from '@mashroom/mashroom/type-definitions';

// Session data
declare module 'express-session' {
    interface SessionData {
        lang?: string;
    }
}

export interface MashroomI18NService {
    /**
     * Get the currently set language (for current session)
     */
    getLanguage(req: Request): string;

    /**
     * Set session language
     */
    setLanguage(language: string, req: Request): void;

    /**
     * Get the message for given key and language
     */
    getMessage(key: string, language: string): string;

    /**
     * Get plain string in the current users language from a I18NString
     */
    translate(req: Request, str: I18NString): string;

    /**
     * Get available languages
     */
    readonly availableLanguages: Readonly<Array<string>>;

    /**
     * Get the default languages
     */
    readonly defaultLanguage: string;
}
