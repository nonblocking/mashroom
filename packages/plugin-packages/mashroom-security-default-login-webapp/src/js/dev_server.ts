
import {resolve} from 'path';
import express from 'express';
import app from './webapp';
import {setLoginFormTitle, setStyleFile} from './context';

import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';

setLoginFormTitle({
    en: 'Login',
    de: 'Anmelden'
});
setStyleFile(resolve(__dirname, './style.css'));

const wrapperApp = express();

// Dummy services
wrapperApp.use((req: ExpressRequest, res: ExpressResponse, next) => {
    const pluginContext: any = {
        loggerFactory: () => console,
        services: {
            security: {
                service: {
                    getUser() {
                        return null;
                    },
                    async login() {
                        return {
                            success: false,
                        };
                    },
                    getUrlBeforeAuthentication() {
                        return 'https://www.mashroom-server.com'
                    }
                },
            },
            i18n: {
                service: {
                    getLanguage: () => 'en',
                    getMessage: (key: string) => key,
                    translate: (req: any, title: any) => title.de
                },
            },
            csrf: {
                service: {
                    getCSRFToken: () => 'asdfjiwomv'
                }
            }
        },
    }
    req.pluginContext = pluginContext;

    next();
});

wrapperApp.get('/', (req: ExpressRequest, res: ExpressResponse) => {
    res.redirect('/login');
});

wrapperApp.use('/login', app);

wrapperApp.listen(5077, () => {
    console.log('Listening on 5077');
});

