
/* eslint no-console: off */

import express from 'express';
import app from './webapp';

import  { ExpressRequest, ExpressResponse } from '@mashroom/mashroom/type-definitions';

const wrapperApp = express();

// Dummy services
wrapperApp.use((req: ExpressRequest, res: ExpressResponse, next) => {
    req.pluginContext = {
        loggerFactory: () => console,
        services: {

        }
    };

    next();
});

wrapperApp.use('/', app);

wrapperApp.listen(5058, () => {
    console.log('Listening on 5058');
});

