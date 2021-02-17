
import express from 'express';
import app from './webapp';

const wrapperApp = express();

// Dummy services
wrapperApp.use((req, res, next) => {
    const pluginContext: any = {
        loggerFactory: () => console,
        services: {
        }
    };

    req.pluginContext = pluginContext;

    next();
});

wrapperApp.use('/', app);

wrapperApp.listen(5058, () => {
    console.log('Listening on 5058');
});
wrapperApp.once('error', (error) => {
    console.error('Failed to start server!', error);
});

