// @flow
/* eslint no-console: off */

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
    req.pluginContext = {
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
                    getMessage: (key) => key,
                    translate: (req, title) => title.de
                },
            },
            csrf: {
                service: {
                    getCSRFToken: () => 'asdfjiwomv'
                }
            }
        },
    };

    next();
});

wrapperApp.use('/login', app);

wrapperApp.listen(8080, () => {
    console.log('Listening on 8080');
});

