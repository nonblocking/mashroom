
import {PAGES_COLLECTION, PORTAL_APP_INSTANCES_COLLECTION, SITES_COLLECTION} from './constants';
import {createAppInstanceId} from './utils/id-utils';

import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorageService} from '@mashroom/mashroom-storage/type-definitions';
import type {MashroomPortalAppInstance, MashroomPortalPage, MashroomPortalSite} from '../../type-definitions';
import type {MashroomSecurityRoleDefinition} from '@mashroom/mashroom-security/type-definitions';

const ROLE_DEFINITIONS_COLLECTION_NAME = 'mashroom-security-role-definitions';
export const ROLE_ADMINISTRATOR = 'Administrator';

export default async (portalName: string, addDemoPages: boolean, storageService: MashroomStorageService, loggerFactory: MashroomLoggerFactory): Promise<void> => {
    const log = loggerFactory('mashroom.portal.storage.fixture');

    const sitesCollection: MashroomStorageCollection<MashroomPortalSite> = await storageService.getCollection(SITES_COLLECTION);
    const pagesCollection: MashroomStorageCollection<MashroomPortalPage> = await storageService.getCollection(PAGES_COLLECTION);
    const portalAppInstancesCollection: MashroomStorageCollection<MashroomPortalAppInstance> = await storageService.getCollection(PORTAL_APP_INSTANCES_COLLECTION);
    const rolesCollection: MashroomStorageCollection<MashroomSecurityRoleDefinition> = await storageService.getCollection(ROLE_DEFINITIONS_COLLECTION_NAME);

    const {result} = await sitesCollection.find(undefined, 1);
    if (result.length > 0) {
        return;
    }

    const adminRole: MashroomSecurityRoleDefinition = {
        id: ROLE_ADMINISTRATOR,
        description: 'The administrator role'
    };

    const welcomeAppInstance1: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Welcome Portal App',
        instanceId: createAppInstanceId(),
    };

    const reactDemoAppInstance1: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal Demo React App 2',
        instanceId: createAppInstanceId(),
        appConfig: {
        },
    };

    const reactDemoAppInstance2: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal Demo React App',
        instanceId: createAppInstanceId(),
        appConfig: {
            message: 'This simple React based SPA was launched with a different...',
        },
    };

    const reactDemoAppInstance3: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal Demo React App',
        instanceId: createAppInstanceId(),
        appConfig: {
            message: '...configuration than this instance of the same SPA',
        },
    };

    const reactDemoAppInstance4: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal Demo React App',
        instanceId: createAppInstanceId(),
        appConfig: {
            message: 'This React SPA is part of a tabbed container formed by the Mashroom Portal Tabify App',
        },
    };

    const angularDemoAppInstance1: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal Demo Angular App',
        instanceId: createAppInstanceId(),
        appConfig: {
        },
    };

    const compositeDemoAppInstance1: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal Demo Composite App',
        instanceId: createAppInstanceId(),
        appConfig: {
        },
    };

    const loadDynamicallyDemoAppInstance1: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal Demo Load Dynamically App',
        instanceId: createAppInstanceId(),
    };

    const restProxyDemoAppInstance1: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal Demo Rest Proxy App',
        instanceId: createAppInstanceId(),
    };

    const tabifyAppInstance1: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal Tabify App',
        instanceId: createAppInstanceId(),
    };

    const remoteDemoAppInstance1: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal Demo Hybrid Rendering Remote App',
        instanceId: createAppInstanceId(),
        appConfig: {
        },
    };

    const sandboxAppInstance: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Sandbox App',
        instanceId: createAppInstanceId(),
    };

    const galleryAppInstance: MashroomPortalAppInstance = {
        pluginName: 'Mashroom Portal App Gallery App',
        instanceId: createAppInstanceId(),
    };

    const pageHomeEmpty: MashroomPortalPage = {
        pageId: 'home',
        description: 'Home',
        layout: 'Mashroom Portal Default Layouts 2 Columns with 1 Column Header',
        portalApps: {},
    };

    const pageHome: MashroomPortalPage = {
        pageId: 'home',
        description: 'Mashroom Portal Demo Site Home',
        layout: 'Mashroom Portal Default Layouts 2 Columns with 1 Column Header',
        portalApps: {
            'app-area1': [{
                pluginName: welcomeAppInstance1.pluginName,
                instanceId: welcomeAppInstance1.instanceId,
            }],
            'app-area2': [{
                pluginName: reactDemoAppInstance1.pluginName,
                instanceId: reactDemoAppInstance1.instanceId,
            }],
            'app-area3': [{
                pluginName: angularDemoAppInstance1.pluginName,
                instanceId: angularDemoAppInstance1.instanceId,
            }],
        },
    };

    const pageTest1: MashroomPortalPage = {
        pageId: 'test1',
        description: 'Mashroom Portal Demo Site Test Page 1',
        layout: 'Mashroom Portal Default Layouts 2 Columns',
        portalApps: {
            'app-area1': [{
                pluginName: reactDemoAppInstance2.pluginName,
                instanceId: reactDemoAppInstance2.instanceId,
            }],
            'app-area2': [{
                pluginName: reactDemoAppInstance3.pluginName,
                instanceId: reactDemoAppInstance3.instanceId,
            }],
        },
    };

    const subPage1: MashroomPortalPage = {
        pageId: 'subpage1',
        description: 'Mashroom Portal Demo Site Test Subpage 1',
        layout: 'Mashroom Portal Default Layouts 2 Columns',
        portalApps: {
            'app-area1': [{
                pluginName: loadDynamicallyDemoAppInstance1.pluginName,
                instanceId: loadDynamicallyDemoAppInstance1.instanceId,
            }],
            'app-area2': [],
        },
    };

    const subPage2: MashroomPortalPage = {
        pageId: 'subpage2',
        description: 'Mashroom Portal Demo Site Test Subpage 2',
        layout: 'Mashroom Portal Default Layouts 1 Column',
        portalApps: {
            'app-area1': [{
                pluginName: tabifyAppInstance1.pluginName,
                instanceId: tabifyAppInstance1.instanceId,
            }, {
                pluginName: reactDemoAppInstance4.pluginName,
                instanceId: reactDemoAppInstance4.instanceId,
            }, {
                pluginName: restProxyDemoAppInstance1.pluginName,
                instanceId: restProxyDemoAppInstance1.instanceId,
            }]
        },
    };

    const pageTest2: MashroomPortalPage = {
        pageId: 'test2',
        description: 'Mashroom Portal Demo Site Test Page 2',
        layout: 'Mashroom Portal Default Layouts 1 Column',
        portalApps: {
            'app-area1': [{
                pluginName: compositeDemoAppInstance1.pluginName,
                instanceId: compositeDemoAppInstance1.instanceId,
            }],
        },
    };

    const pageTest3: MashroomPortalPage = {
        pageId: 'test3',
        description: 'Mashroom Portal Demo Site Test Page 3',
        layout: 'Mashroom Portal Default Layouts 1 Column',
        portalApps: {
            'app-area1': [{
                pluginName: remoteDemoAppInstance1.pluginName,
                instanceId: remoteDemoAppInstance1.instanceId,
            }],
        },
    };

    const pageSandbox: MashroomPortalPage = {
        pageId: 'sandbox',
        description: 'Mashroom Portal Demo Site Sandbox Page',
        layout: 'Mashroom Portal Default Layouts 1 Column',
        portalApps: {
            'app-area1': [{
                pluginName: sandboxAppInstance.pluginName,
                instanceId: sandboxAppInstance.instanceId,
            }],
        },
    };

    const pageGallery: MashroomPortalPage = {
        pageId: 'app-gallery',
        description: 'Mashroom Portal Demo Site Gallery App Page',
        layout: 'Mashroom Portal Default Layouts 1 Column',
        portalApps: {
            'app-area1': [{
                pluginName: galleryAppInstance.pluginName,
                instanceId: galleryAppInstance.instanceId,
            }],
        },
    };

    const siteMinimal: MashroomPortalSite = {
        siteId: 'default',
        title: portalName,
        path: '/web',
        pages: [
            {
                pageId: 'home',
                title: 'Home',
                friendlyUrl: '/',
            },
        ],
    };

    const site: MashroomPortalSite = {
        siteId: 'default',
        title: portalName,
        path: '/web',
        pages: [
            {
                pageId: pageHome.pageId,
                title: 'Home',
                friendlyUrl: '/',
            },
            {
                pageId: pageTest1.pageId,
                title: {
                    en: 'Test Page 1',
                    de: 'Test Seite 1'
                },
                friendlyUrl: '/test1',
                subPages: [
                    {
                        pageId: subPage1.pageId,
                        title: {
                            en: 'Test Subpage',
                            de: 'Test Unterseite'
                        },
                        friendlyUrl: '/test1/sub1',
                    },
                    {
                        pageId: subPage2.pageId,
                        title: {
                            en: 'Test Subpage 2',
                            de: 'Test Unterseite 2'
                        },
                        friendlyUrl: '/test1/sub2',
                    },
                ],
            },
            {
                pageId: pageTest2.pageId,
                title: {
                    en: 'Test Page 2',
                    de: 'Test Seite 2'
                },
                friendlyUrl: '/test2',
                subPages: [],
            },
            {
                pageId: pageTest3.pageId,
                title: {
                    en: 'Test Page 3',
                    de: 'Test Seite 3'
                },
                friendlyUrl: '/test3',
                subPages: [],
            },
            {
                pageId: pageSandbox.pageId,
                title: {
                    en: 'Sandbox'
                },
                friendlyUrl: '/sandbox',
                subPages: [],
            },
            {
                pageId: pageGallery.pageId,
                title: {
                    en: 'App Gallery',
                    de: 'App Gallerie'
                },
                friendlyUrl: '/app-gallery',
                subPages: [],
            },
        ],
    };

     try {
         log.info('Creating portal demo data');

         if (addDemoPages) {
             await sitesCollection.insertOne(site);
             await pagesCollection.insertOne(pageHome);

             await pagesCollection.insertOne(pageTest1);
             await pagesCollection.insertOne(subPage1);
             await pagesCollection.insertOne(subPage2);
             await pagesCollection.insertOne(pageTest2);
             await pagesCollection.insertOne(pageTest3);
             await pagesCollection.insertOne(pageSandbox);
             await pagesCollection.insertOne(pageGallery);

             await portalAppInstancesCollection.insertOne(welcomeAppInstance1);
             await portalAppInstancesCollection.insertOne(reactDemoAppInstance1);
             await portalAppInstancesCollection.insertOne(reactDemoAppInstance2);
             await portalAppInstancesCollection.insertOne(reactDemoAppInstance3);
             await portalAppInstancesCollection.insertOne(reactDemoAppInstance4);
             await portalAppInstancesCollection.insertOne(angularDemoAppInstance1);
             await portalAppInstancesCollection.insertOne(compositeDemoAppInstance1);
             await portalAppInstancesCollection.insertOne(loadDynamicallyDemoAppInstance1);
             await portalAppInstancesCollection.insertOne(restProxyDemoAppInstance1);
             await portalAppInstancesCollection.insertOne(tabifyAppInstance1);
             await portalAppInstancesCollection.insertOne(remoteDemoAppInstance1);
             await portalAppInstancesCollection.insertOne(sandboxAppInstance);
             await portalAppInstancesCollection.insertOne(galleryAppInstance);
         } else {
             await sitesCollection.insertOne(siteMinimal);
             await pagesCollection.insertOne(pageHomeEmpty);
         }

         await rolesCollection.insertOne(adminRole);
    } catch (e) {
        log.error('Inserting portal demo data failed', e);
    }
};
