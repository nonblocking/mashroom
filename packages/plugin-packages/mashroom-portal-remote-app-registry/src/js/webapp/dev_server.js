// @flow
/* eslint no-console: off */

import express from 'express';
import app from './webapp';

import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';
import type {RemotePortalAppEndpoint} from '../../../type-definitions';

const wrapperApp = express();

const portalApp1: any = { name: 'Portal App 1' };
const portalApp2: any = { name: 'Portal App 1' };
let testEndpoints: Array<RemotePortalAppEndpoint> = [{
    url: 'http://localhost:8080/test',
    sessionOnly: false,
    lastError: null,
    retries: 0,
    registrationTimestamp: Date.now(),
    portalApps: [portalApp1, portalApp2]
}, {
    url: 'http://localhost:8080/test2',
    sessionOnly: true,
    lastError: 'Connection timeout',
    retries: 3,
    registrationTimestamp: null,
    portalApps: []
}, {
    url: 'http://localhost:8080/test3',
    sessionOnly: false,
    lastError: null,
    retries: 0,
    registrationTimestamp: null,
    portalApps: []
}];

// Dummy services
wrapperApp.use((req: ExpressRequest, res: ExpressResponse, next) => {
    req.pluginContext = {
        loggerFactory: () => console,
        services: {
            remotePortalAppEndpoint: {
                service: {
                    async findAll() {
                        return testEndpoints;
                    },
                    async registerRemoteAppUrl(url) {
                        testEndpoints.push({
                            url,
                            sessionOnly: false,
                            lastError: null,
                            retries: 0,
                            registrationTimestamp: null,
                            portalApps: []
                        })
                    },
                    async unregisterRemoteAppUrl(url) {
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

    next();
});

wrapperApp.use('/portal-remote-app-registry', app);

wrapperApp.listen(8082, () => {
    console.log('Listening on 8082');
});

