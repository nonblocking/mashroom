
import express from 'express';
// @ts-ignore
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import app from './webapp';

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';

const wrapperApp = express();

// Dummy services
wrapperApp.use((req, res, next) => {
    const pluginContext: any = {
        loggerFactory,
        services: {
        }
    };
    (req as ExpressRequest).pluginContext = pluginContext;

    next();
});

wrapperApp.use('/', app);

wrapperApp.listen(5058, () => {
    console.log('Listening on 5058');
});

