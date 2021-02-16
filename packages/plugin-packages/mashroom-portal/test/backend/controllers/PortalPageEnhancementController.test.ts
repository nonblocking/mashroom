
import {Writable} from 'stream';
// @ts-ignore
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import '../../../src/backend/context/global_portal_context';
import PortalPageEnhancementController from '../../../src/backend/controllers/PortalPageEnhancementController';
import {setPortalPluginConfig} from '../../../src/backend/context/global_portal_context';
import type {MashroomPortalPageEnhancement} from '../../../type-definitions';

setPortalPluginConfig({
    path: '/portal',
    adminApp: 'admin-portal-app',
    defaultTheme: 'foo',
    defaultLayout: 'foo',
    warnBeforeAuthenticationExpiresSec: 120,
    autoExtendAuthentication: false
});

const portalPageEnhancement: MashroomPortalPageEnhancement = {
    name: 'Test Page Enhancement',
    description: null,
    lastReloadTs: Date.now(),
    order: 1000,
    resourcesRootUri: `file://${__dirname}`,
    pageResources: {
        js: [{
            path: 'test_script1.js',
            rule: 'yes',
            location: 'header',
            inline: false,
        }],
        css: []
    },
    plugin: {
        rules: {
            'yes': () => true,
            'no': () => false,
        }
    }
}

const pluginRegistry: any = {
    portalPageEnhancements: [portalPageEnhancement],
};

const pluginContext: any = {
    loggerFactory: dummyLoggerFactory,
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
                'pluginName': 'Test Page Enhancement',
                '0': 'test_script1.js',
            },
            pluginContext,
            query: {},
        };

        let type: string | undefined;
        const res: any = new Writable({
            write: (chunk) => {
                expect(type).toBe('text/javascript');
                expect(chunk).toBeTruthy();
                done();
            },
        });

        res.type = (_type: string) => { type = _type };
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
                'pluginName': 'Test Page Enhancement',
                '0': 'test_script2.js',
            },
            pluginContext,
            query: {},
        };

        const res: any = {
            sendStatus(status: number) {
                expect(status).toBe(404);
                done();
            }
        }

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
                'pluginName': 'Test Page Enhancement XXX',
                '0': 'test_script1.js',
            },
            pluginContext,
            query: {},
        };

        const res: any = {
            sendStatus(status: number) {
                expect(status).toBe(404);
                done();
            }
        }

        res.type = () => { /* nothing to do */ };
        res.set = () => { /* nothing to do */ };

        const controller = new PortalPageEnhancementController(pluginRegistry);
        controller.getPortalPageResource(req, res);
    });
});
