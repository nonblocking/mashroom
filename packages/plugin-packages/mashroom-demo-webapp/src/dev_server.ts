
import express from 'express';
import app from './webapp';

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';

const wrapperApp = express();

// Dummy services
wrapperApp.use((req, res, next) => {
    const requestWithContext = req as ExpressRequest;
    const pluginContext: any = {
        loggerFactory: () => console,
        services: {
        }
    };
    requestWithContext.pluginContext = pluginContext;

    next();
});

wrapperApp.use('/', app);

wrapperApp.listen(5058, () => {
    console.log('Listening on 5058');
});

