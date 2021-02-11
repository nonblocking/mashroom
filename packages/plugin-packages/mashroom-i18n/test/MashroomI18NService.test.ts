
import path from 'path';
// @ts-ignore
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomI18NService from '../src/MashroomI18NService';

describe('MashroomI18NService', () => {

    it('determines the browser locale correctly', () => {
        const i18nService = new MashroomI18NService(['fr', 'en', 'de'], 'de', '', '', loggerFactory);

        const req: any = {
            headers: {
                'accept-language': 'en-GB,en-US;q=0.9,fr-CA;q=0.7,en;q=0.8',
            },
            session: {
            },
            pluginContext: {
                loggerFactory
            }
        };

        const lang = i18nService.getLanguage(req);

        expect(lang).toBe('en');
        expect(req.session.lang).toBe('en');
    });

    it('sets the locale in the session object', () => {
        const i18nService = new MashroomI18NService(['fr', 'en', 'de'], 'de', '', '', loggerFactory);

        const req: any = {
            session: {
                lang: 'de',
            },
        };

        i18nService.setLanguage('ru', req);

        expect(req.session.lang).toBe('ru');
    });

    it('determines the message correctly', () => {

        const translationsFolder = path.resolve(__dirname, './test-messages');
        const i18nService = new MashroomI18NService(['fr', 'en', 'de'], 'de', translationsFolder, '', loggerFactory);

        const messsageUsernameEn = i18nService.getMessage('username', 'en');
        const messsageUsernameDe = i18nService.getMessage('username', 'de');
        const messsageUsernameRu = i18nService.getMessage('username', 'ru');
        const messsageFooEn = i18nService.getMessage('foo', 'en');
        const messsageFooDe = i18nService.getMessage('foo', 'de');

        expect(messsageUsernameEn).toBe('Username');
        expect(messsageUsernameDe).toBe('Benutzername 2');
        expect(messsageUsernameRu).toBe('Username');
        expect(messsageFooEn).toBe('foo');
        expect(messsageFooDe).toBe('Franz');
    });

});

