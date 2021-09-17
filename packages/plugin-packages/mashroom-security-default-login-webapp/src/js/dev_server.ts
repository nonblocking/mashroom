
import {resolve} from 'path';
import express from 'express';
import app from './webapp';
import {setLoginFormTitle, setStyleFile} from './context';

import type {Request, Response} from 'express';

setLoginFormTitle({
    en: 'Login',
    de: 'Anmelden'
});
setStyleFile(resolve(__dirname, './style.css'));

const wrapperApp = express();

// Dummy services
wrapperApp.use((req: Request, res: Response, next) => {
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

wrapperApp.get('/', (req: Request, res: Response) => {
    res.redirect('/login');
});

wrapperApp.use('/login', app);

wrapperApp.listen(5077, () => {
    console.log('Listening on 5077');
});
wrapperApp.once('error', (error) => {
    console.error('Failed to start server!', error);
});

