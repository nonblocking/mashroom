
import path from 'path';
import express from 'express';
// @ts-ignore
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import context, {setPortalPluginConfig} from './context/global_portal_context';
import setupWebapp from './setup-webapp';
import {SITES_COLLECTION, PAGES_COLLECTION, PORTAL_APP_INSTANCES_COLLECTION} from './constants';
import MashroomPortalService from './services/MashroomPortalService';

import type {
    MashroomPluginContext,
    ExpressRequest,
    ExpressResponse,
    ExpressNextFunction
} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageService} from '@mashroom/mashroom-storage/type-definitions';
import type {MashroomPortalSite, MashroomPortalPage, MashroomPortalApp, MashroomPortalAppInstance} from '../../type-definitions';

const app = express();
app.get('/', (req, res: ExpressResponse) => {
    res.type('text/html');
    res.send(`
        <html>
            <body>
                <a href="/portal/web">Portal</a>
            </body>
        </html>
    `);
});

setPortalPluginConfig({
    path: '/portal',
    defaultTheme: 'Portal Default Theme',
    defaultLayout: 'Portal Default Layout',
    adminApp: '',
    warnBeforeAuthenticationExpiresSec: 120,
    autoExtendAuthentication: false
});

// Plugins

const welcomeApp: MashroomPortalApp = {
    name: 'Mashroom Welcome Portal App',
    title: {
      en: 'Welcome Portal App',
      de: 'Willkommen Portal App'
    },
    description: 'Welcome App',
    tags: [],
    category: 'demo',
    version: '1.0',
    homepage: null,
    author: null,
    license: null,
    metaInfo: null,
    lastReloadTs: Date.now(),
    globalLaunchFunction: 'startWelcomeApp',
    resourcesRootUri: `file://${path.resolve(__dirname, '../frontend')}`,
    resources: {
        js: ['welcome-app.js'],
        css: [],
    },
    sharedResources: {
        js: [],
        css: [],
    },
    screenshots: null,
    defaultRestrictViewToRoles: null,
    rolePermissions: null,
    restProxies: null,
    defaultAppConfig: {},
};

context.pluginRegistry.registerPortalApp(welcomeApp);

// Mock middleware

const serverConfig: any = {
    name: 'Standalone Dev Portal'
};


const mockPortalSitesCollection: any = {
    findOne: (filter?: any, limit?: number) => {
        return Promise.resolve(mockSite);
    },
};

const mockPortalPagesCollection: any = {
    findOne: (filter?: any, limit?: number) => {
        return Promise.resolve(mockPage);
    },
};

const mockPortalAppCollection: any = {
    findOne: (filter?: any, limit?: number) => {
        return Promise.resolve(welcomeAppInstance1);
    },
};

const mockSite: MashroomPortalSite = {
    siteId: 'default',
    title: 'Default Site',
    path: '/web',
    pages: [
        {
            pageId: 'test-page',
            title: {
                en: 'Test Page',
                de: 'Test Seite'
            },
            friendlyUrl: '/',
            subPages: [],
        },
    ],
};

const mockPage: MashroomPortalPage = {
    pageId: 'test-page',
    portalApps: {
        'app-area1': [{
            pluginName: 'Mashroom Welcome Portal App',
            instanceId: 'ABCDEF',
        }],
    },
};

const welcomeAppInstance1: MashroomPortalAppInstance = {
    pluginName: 'Mashroom Welcome Portal App',
    instanceId: 'ABCDEF',
    appConfig: {
        foo: 'bar',
    },
};

// @ts-ignore
app.use((req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {

    const pluginService: any = {};
    const middlewareStackService: any = {};
    const storageService: MashroomStorageService = {
        getCollection: async (collection: string) => {
            switch (collection) {
                case SITES_COLLECTION:
                    return mockPortalSitesCollection;
                case PAGES_COLLECTION:
                    return mockPortalPagesCollection;
                case PORTAL_APP_INSTANCES_COLLECTION:
                    return mockPortalAppCollection;
                default:
                    throw new Error('Collection not found');
            }
        },
    };
    const securityService: any = {
        getUser() {
            return {
                username: 'admin',
                roles: ['Administrator']
            };
        },
        isAdmin() {
            return true;
        },
        checkResourcePermission() {
            return true;
        }
    };
    const i18nService: any = {
        getLanguage() {
            return 'en';
        },
        getMessage(key: string) {
            return key;
        },
        translate(req: any, str: any) {
            if (typeof(str) === 'string') {
                return str;
            }
            return str['en'];
        }
    };

    const portalService: any = {
        service: null
    };
    const pluginContext: MashroomPluginContext = {
        serverInfo: {
            version: '1.0.0',
            devMode: true,
        },
        serverConfig,
        loggerFactory: dummyLoggerFactory,
        services: {
            core: {
                pluginService,
                middlewareStackService,
            },
            storage: {
                service: storageService,
            },
            security: {
                service: securityService,
            },
            i18n: {
                service: i18nService,
            },
            portal: portalService
        },
    };
    const pluginContextHolder = {
        getPluginContext() {
            return pluginContext;
        }
    };

    portalService.service = new MashroomPortalService(context.pluginRegistry, pluginContextHolder);

    req.pluginContext = pluginContext;

    next();
});

app.use('/portal', setupWebapp(context.pluginRegistry));

app.listen('5050', ()  => {
    console.info('Portal standalone test server listening on port 5050');
});
