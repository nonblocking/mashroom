
import {URL} from 'url';
import express, {type Request, type Response} from 'express';
import {SCANNER_NAME} from '../scanner/KubernetesRemotePluginPackagesScanner';
import context from '../context';
import app from './webapp';
import type {KubernetesService} from '../types';
import type {MashroomPotentialPluginPackage} from '@mashroom/mashroom/type-definitions';

const testServices: Array<KubernetesService> = [{
    uid: '1',
    name: 'Service 1',
    namespace: 'namespace1',
    targetPort: '1234',
    url: new URL('http://service1.namespace1:8080'),
    selector: {},
    firstSeen: Date.now(),
    lastModified: Date.now(),
    error: null,
    imageVersion: undefined,
    runningPods: 1,
}, {
    uid: '2',
    name: 'Service 2',
    namespace: 'namespace1',
    targetPort: '1234',
    url: new URL('http://service2.namespace1:8080'),
    selector: {},
    firstSeen: Date.now(),
    lastModified: Date.now(),
    error: null,
    imageVersion: '1.0.1',
    runningPods: 1,
}, {
    uid: '3',
    name: 'Service 3',
    namespace: 'namespace2',
    targetPort: '1234',
    url: undefined,
    selector: undefined,
    firstSeen: Date.now(),
    lastModified: Date.now(),
    error: 'Headless Service',
    imageVersion: undefined,
    runningPods: 0,
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
    res.redirect('/remote-plugin-packages-kubernetes');
});

wrapperApp.use('/remote-plugin-packages-kubernetes', app);

wrapperApp.listen(8083, () => {
    console.log('Listening on 8083');
});
wrapperApp.once('error', (error) => {
    console.error('Failed to start server!', error);
});

