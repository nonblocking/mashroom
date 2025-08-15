
import {URL} from 'url';
import express from 'express';
import {SCANNER_NAME} from '../scanner/RemotePortalAppsPluginScanner';
import app from './webapp';
import type {MashroomPotentialPluginPackage} from '@mashroom/mashroom/type-definitions';

import type {Request, Response} from 'express';
import type {RemotePortalAppEndpoint} from '../../../type-definitions';

const wrapperApp = express();

const testEndpoints: Array<RemotePortalAppEndpoint> = [{
    url: 'http://localhost:8080/test',
    lastRefreshTimestamp: Date.now(),
    initialScan: true,
}, {
    url: 'http://localhost:8080/test2',
    lastRefreshTimestamp: Date.now(),
    initialScan: true,
}, {
    url: 'http://localhost:8080/test3',
    lastRefreshTimestamp: Date.now(),
    initialScan: true,
}];

const testPackages: Array<MashroomPotentialPluginPackage> = [{
    url: new URL('http://localhost:8080/test'),
    scannerName: SCANNER_NAME,
    definitionBuilderName: '',
    processedOnce: false,
    status: 'processing',
    lastUpdate: Date.now(),
    updateErrors: null,
    foundPlugins: null,
}, {
    url: new URL('http://localhost:8080/test2'),
    scannerName: SCANNER_NAME,
    definitionBuilderName: '',
    processedOnce: true,
    status: 'processed',
    lastUpdate: Date.now(),
    updateErrors: null,
    foundPlugins: ['App1', 'App2'],
}, {
    url: new URL('http://localhost:8080/test3'),
    scannerName: SCANNER_NAME,
    definitionBuilderName: '',
    processedOnce: true,
    status: 'processed',
    lastUpdate: Date.now(),
    updateErrors: ['Connection reset'],
    foundPlugins: null,
}];

// Dummy services
wrapperApp.use((req: Request, res: Response, next) => {
    const pluginContext: any = {
        loggerFactory: () => console,
        services: {
            core: {
                pluginService: {
                    getPotentialPluginPackagesByScanner() {
                        return testPackages;
                    },
                }
            },
            csrf: {
                service: {
                    getCSRFToken: () => 'asdfjiwomv'
                }
            },
            storage: {
                service: {
                    getCollection: () => ({
                        find: async() => {
                            return {
                                result: testEndpoints,
                            };
                        },
                        updateOne: async() => {
                            return {
                                result: {}
                            };
                        }
                    })
                }
            },

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

