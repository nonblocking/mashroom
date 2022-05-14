
import express from 'express';
import app from './webapp';

import type {Request, Response} from 'express';

const wrapperApp = express();

// Dummy services
wrapperApp.use((req: Request, res: Response, next) => {
    const pluginContext: any = {
        loggerFactory: () => console,
        services: {
            backgroundJobs: {
                service: {
                    jobs: [
                        {
                            name: 'Job number 1',
                            nextInvocation: new Date(Date.now() + 100000),
                            lastInvocation: {
                                timestamp: 1000,
                                executionTimeMs: 1000,
                                success: true,
                            }
                        },
                        {
                            name: 'Job number 2',
                            nextInvocation: new Date(Date.now() + 500),
                            lastInvocation: {
                                timestamp: new Date(),
                                executionTimeMs: 2345,
                                success: false,
                                errorMessage: 'Something went wrong!'
                            }
                        }
                    ],
                }
            }
        },
    };

    req.pluginContext = pluginContext;

    next();
});

wrapperApp.get('/', (req: Request, res: Response) => {
    res.redirect('/background-jobs');
});

wrapperApp.use('/background-jobs', app);

wrapperApp.listen(8087, () => {
    console.log('Listening on 8087');
});
wrapperApp.once('error', (error) => {
    console.error('Failed to start server!', error);
});

