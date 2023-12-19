
import express from 'express';
import app from './webapp';

import type {Request, Response} from 'express';
import type {RemotePortalAppEndpoint} from '../../../type-definitions';

const wrapperApp = express();

const portalApp1: any = { name: 'Portal App 1', version: '1.0.1' };
const portalApp2: any = { name: 'Portal App 2', version: '1.1.0' };
let testEndpoints: Array<RemotePortalAppEndpoint> = [{
    url: 'http://localhost:8080/test',
    sessionOnly: false,
    lastError: null,
    retries: 0,
    registrationTimestamp: Date.now(),
    portalApps: [portalApp1, portalApp2],
    invalidPortalApps: [{
        name: 'Some other App',
        error: 'Invalid configuration'
    }],
}, {
    url: 'http://localhost:8080/test2',
    sessionOnly: true,
    lastError: 'Connection timeout',
    retries: 3,
    registrationTimestamp: null,
    portalApps: [],
    invalidPortalApps: [],
}, {
    url: 'http://localhost:8080/test3',
    sessionOnly: false,
    lastError: null,
    retries: 0,
    registrationTimestamp: null,
    portalApps: [],
    invalidPortalApps: [],
}];

// Dummy services
wrapperApp.use((req: Request, res: Response, next) => {
    const pluginContext: any = {
        loggerFactory: () => console,
        services: {
            remotePortalAppEndpoint: {
                service: {
                    async findAll() {
                        return testEndpoints;
                    },
                    async registerRemoteAppUrl(url: string) {
                        testEndpoints.push({
                            url,
                            sessionOnly: false,
                            lastError: null,
                            retries: 0,
                            registrationTimestamp: null,
                            portalApps: [],
                            invalidPortalApps: [],
                        });
                    },
                    async unregisterRemoteAppUrl(url: string) {
                        testEndpoints = testEndpoints.filter((endpoint) => endpoint.url !== url);
                    }
                },
            },
            csrf: {
                service: {
                    getCSRFToken: () => 'asdfjiwomv'
                }
            }
        },
    };

    req.pluginContext = pluginContext;

    next();
});

wrapperApp.get('/', (req: Request, res: Response) => {
    res.redirect('/portal-remote-app-registry');
});

wrapperApp.use('/portal-remote-app-registry', app);

wrapperApp.listen(8082, () => {
    console.log('Listening on 8082');
});
wrapperApp.once('error', (error) => {
    console.error('Failed to start server!', error);
});

