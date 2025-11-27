
import {Writable} from 'stream';
import {loggingUtils} from '@mashroom/mashroom-utils';
import {setPortalPluginConfig} from '../../../src/backend/context/global-portal-context';
import PortalPageEnhancementController from '../../../src/backend/controllers/PortalPageEnhancementController';
import type {MashroomPortalPageEnhancement} from '../../../type-definitions';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    defaultLayout: 'foo',
    authenticationExpiration: {
        warnBeforeExpirationSec: 120,
        autoExtend: false,
        onExpiration: { strategy: 'reload' },
    },
    ignoreMissingAppsOnPages: false,
    versionHashSalt: null,
    resourceFetchConfig: {
        fetchTimeoutMs: 3000,
        httpMaxSocketsPerHost: 10,
        httpRejectUnauthorized: true,
    },
    defaultProxyConfig: {},
    ssrConfig: {
        ssrEnable: false,
        renderTimoutMs: 2000,
        cacheEnable: false,
        cacheTTLSec: 300,
        inlineStyles: true,
    }
});

const portalPageEnhancement: MashroomPortalPageEnhancement = {
    name: 'Test Page Enhancement',
    description: null,
    version: '1.0.1',
    lastReloadTs: Date.now(),
    order: 1000,
    resourcesRootUri: `file:///${__dirname}`,
    pageResources: {
        js: [{
            path: 'test-script1.js',
            rule: 'yes',
            location: 'header',
            inline: false,
        }],
        css: []
    },
    plugin: {
        rules: {
            yes: () => true,
            no: () => false,
        }
    }
};

const pluginRegistry: any = {
    portalPageEnhancements: [portalPageEnhancement],
};

const pluginContext: any = {
    loggerFactory: loggingUtils.dummyLoggerFactory,
    services: {
    },
};

describe('PortalPageEnhancementController', () => {

    it('loads resources from the filesystem', (done) => {
        const req: any = {
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                pluginName: 'Test Page Enhancement',
                resourcePath: ['test-script1.js'],
            },
            pluginContext,
            query: {},
        };

        let type: string | undefined;
        const res: any = new Writable({
            write: (chunk, encoding, cb) => {
                cb();
            },
            final: (cb) => {
                cb();
                expect(type).toBe('test-script1.js');
                done();
            },
        });
        res.setHeader = () => { /* nothing to do */ };
        res.type = (_type: string) => { type = _type; };
        res.set = () => { /* nothing to do */ };

        const controller = new PortalPageEnhancementController(pluginRegistry);
        controller.getPortalPageResource(req, res);
    });

    it('does not load undefined resources', (done) => {
        const req: any = {
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                pluginName: 'Test Page Enhancement',
                resourcePath: ['test-script2.js'],
            },
            pluginContext,
            query: {},
        };

        const res: any = {
            sendStatus(status: number) {
                expect(status).toBe(404);
                done();
            }
        };

        res.type = () => { /* nothing to do */ };
        res.set = () => { /* nothing to do */ };

        const controller = new PortalPageEnhancementController(pluginRegistry);
        controller.getPortalPageResource(req, res);
    });

    it('does not load resources from unknown plugins', (done) => {
        const req: any = {
            connection: {
                remoteAddress: '127.0.0.1'
            },
            params: {
                pluginName: 'Test Page Enhancement XXX',
                resourcePath: ['test-script1.js'],
            },
            pluginContext,
            query: {},
        };

        const res: any = {
            sendStatus(status: number) {
                expect(status).toBe(404);
                done();
            }
        };

        res.type = () => { /* nothing to do */ };
        res.set = () => { /* nothing to do */ };

        const controller = new PortalPageEnhancementController(pluginRegistry);
        controller.getPortalPageResource(req, res);
    });
});
