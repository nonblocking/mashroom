
import fs from 'fs';
import path from 'path';
import acceptLanguageParser from 'accept-language-parser';

import type {Request} from 'express';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    I18NString,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService as MashroomI18NServiceType} from '../type-definitions';

const BUILT_IN_MESSAGES_FOLDER = path.resolve(__dirname, '../messages');
const MESSAGES_EXISTS_CACHE: Record<string, boolean> = {};

export default class MashroomI18NService implements MashroomI18NServiceType {

    private _availableLanguages: Array<string>;
    private _defaultLanguage: string;
    private _messagesFolder: string;
    private _logger: MashroomLogger;

    constructor(availableLanguages: Array<string>, defaultLanguage: string, messagesFolder: string,
                serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        this._availableLanguages = availableLanguages;
        this._defaultLanguage = defaultLanguage;
        this._messagesFolder = messagesFolder;
        this._logger = loggerFactory('mashroom.i18n.service');

        if (!path.isAbsolute(this._messagesFolder)) {
            this._messagesFolder = path.resolve(serverRootFolder, this._messagesFolder);
        }

        this._logger.info(`Looking for messages in: ${this._messagesFolder}`);
    }

    getLanguage(req: Request): string {
        let language = req.session.lang;
        if (!language) {
            language = this._detectBrowserLanguage(req);
            this.setLanguage(language, req);
        }
        return language;
    }

    setLanguage(language: string, req: Request): void {
        req.session.lang = language;
    }

    getMessage(key: string, language: string): string {
        const messagesPaths = [
            path.resolve(this._messagesFolder, `messages.${language}.json`),
            path.resolve(BUILT_IN_MESSAGES_FOLDER, `messages.${language}.json`),
            path.resolve(this._messagesFolder, `messages.json`),
            path.resolve(BUILT_IN_MESSAGES_FOLDER, `messages.json`),
        ];

        const existingMessagesPaths = messagesPaths.filter((mb) => this._bundleExists(mb));

        for (const messagesPath of existingMessagesPaths) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const messages = require(messagesPath);
                const message = messages[key];
                if (message) {
                    return message;
                }
            } catch (error) {
                this._logger.error(`Error loading message bundle: ${messagesPath}`);
            }
        }

        // No message found
        return key;
    }

    translate(req: Request, str: I18NString): string {
        if (!str || typeof(str) === 'string') {
            return str;
        }

        const lang = this.getLanguage(req);
        if (str[lang]) {
            return str[lang];
        }

        const defaultLang = this.defaultLanguage;
        if (str[defaultLang]) {
            return str[defaultLang];
        }

        // Just take any
        const languages = Object.keys(str);
        if (languages && languages.length > 0) {
            return str[languages[0]];
        }

        return '???';
    }

    get availableLanguages(): Readonly<Array<string>> {
        return Object.freeze(this._availableLanguages.slice(0));
    }

    get defaultLanguage(): string {
        return this._defaultLanguage;
    }

    private _bundleExists(path: string): boolean {
        let exists = MESSAGES_EXISTS_CACHE[path];
        if (typeof(exists) !== 'undefined') {
            return exists;
        }
        exists = fs.existsSync(path);
        MESSAGES_EXISTS_CACHE[path] = exists;
        return exists;
    }

    private _detectBrowserLanguage(req: Request): string {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.i18n.service');
        const acceptLanguageHeader = req.headers['accept-language'] as string;
        const language = acceptLanguageParser.pick(this._availableLanguages, acceptLanguageHeader, {loose: true}) || this._defaultLanguage;
        logger.debug(`Detected browser language based on the accept-language header: ${language}`);
        return language;
    }

}
