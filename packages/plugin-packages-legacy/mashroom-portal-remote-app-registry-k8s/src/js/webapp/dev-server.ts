
import {URL} from 'url';
import express, {type Request, type Response} from 'express';
import {SCANNER_NAME} from '../scanner/KubernetesRemotePortalAppsPluginScanner';
import context from '../context';
import app from './webapp';
import type {KubernetesService} from '../../../type-definitions';
import type {MashroomPotentialPluginPackage} from '@mashroom/mashroom/type-definitions';

const testServices: Array<KubernetesService> = [{
    name: 'Service 1',
    namespace: 'namespace1',
    url: new URL('http://service1.namespace1:8080'),
    ip: undefined,
    port: undefined,
    firstSeen: Date.now(),
    lastCheck: Date.now(),
    error: null,
}, {
    name: 'Service 2',
    namespace: 'namespace1',
    url: new URL('http://service2.namespace1:8080'),
    ip: undefined,
    port: undefined,
    firstSeen: Date.now(),
    lastCheck: Date.now(),
    error: null,
}, {
    name: 'Service 3',
    namespace: 'namespace2',
    url: new URL('http://foo'),
    ip: undefined,
    port: undefined,
    firstSeen: Date.now(),
    lastCheck: Date.now(),
    error: 'Headless Service',
}];

context.services = testServices;

const testPackages: Array<MashroomPotentialPluginPackage> = [{
    url: new URL('http://service1.namespace1:8080'),
    scannerName: SCANNER_NAME,
    definitionBuilderName: '',
    processedOnce: false,
    status: 'processing',
    lastUpdate: Date.now(),
    updateErrors: null,
    foundPlugins: null,
}, {
    url: new URL('http://service2.namespace1:8080'),
    scannerName: SCANNER_NAME,
    definitionBuilderName: '',
    processedOnce: true,
    status: 'processed',
    lastUpdate: Date.now(),
    updateErrors: null,
    foundPlugins: ['App1', 'App2'],
}];

const contextHolder: any = {
    getPluginContext: () => ({
        loggerFactory: () => console,
        serverConfig: {
            externalPluginConfigFileNames: ['mashroom']
        },
        services: {
            core: {
                pluginService: {
                    getPotentialPluginPackagesByScanner() {
                        return testPackages;
                    },
                    onUnloadOnce: () => {
                        // no implementation required
                    },
                },
            },
        },
    })
};

const wrapperApp = express();

wrapperApp.use((req: Request, res: Response, next) => {
    req.pluginContext = contextHolder.getPluginContext();
    next();
});

wrapperApp.get('/', (req, res) => {
    res.redirect('/portal-remote-app-registry-kubernetes');
});

wrapperApp.use('/portal-remote-app-registry-kubernetes', app);

wrapperApp.listen(8083, () => {
    console.log('Listening on 8083');
});
wrapperApp.once('error', (error) => {
    console.error('Failed to start server!', error);
});

