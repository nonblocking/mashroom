
import express from 'express';
import bodyParser from 'body-parser';

import PortalIndexController from './controllers/PortalIndexController';
import PortalResourcesController from './controllers/PortalResourcesController';
import PortalPageController from './controllers/PortalPageController';
import PortalPageEnhancementController from './controllers/PortalPageEnhancementController';
import PortalPageRenderController from './controllers/PortalPageRenderController';
import PortalSiteController from './controllers/PortalSiteController';
import PortalAppController from './controllers/PortalAppController';
import PortalThemeController from './controllers/PortalThemeController';
import PortalLayoutController from './controllers/PortalLayoutController';
import PortalRolesController from './controllers/PortalRolesController';
import PortalHttpProxyController from './controllers/PortalHttpProxyController';
import PortalLanguageController from './controllers/PortalLanguageController';
import PortalUserController from './controllers/PortalUserController';
import PortalLogController from './controllers/PortalLogController';
import {
    PORTAL_APP_API_PATH,
    PORTAL_APP_RESOURCES_BASE_PATH,
    PORTAL_APP_RESOURCES_SHARED_PATH,
    PORTAL_APP_REST_PROXY_BASE_PATH,
    PORTAL_JS_FILE,
    SYSTEMJS_JS_FILE,
    PORTAL_INTERNAL_PATH,
    PORTAL_THEME_RESOURCES_BASE_PATH,
    PORTAL_PAGE_ENHANCEMENT_RESOURCES_BASE_PATH,
} from './constants';
import {getPortalPushPluginUpdatesRoute} from './push-plugin-updates';

import type {MashroomPortalPluginRegistry as MashroomPortalPluginRegistryType} from '../../type-definitions/internal';

export default (pluginRegistry: MashroomPortalPluginRegistryType) => {
    const portalWebapp = express();
    portalWebapp.enable('etag');

    const portalIndexController = new PortalIndexController();
    const portalResourcesController = new PortalResourcesController();
    const portalPageController = new PortalPageController(pluginRegistry);
    const portalPageEnhancementController = new PortalPageEnhancementController(pluginRegistry);
    const portalPageRenderController = new PortalPageRenderController(portalWebapp, pluginRegistry);
    const portalSiteController = new PortalSiteController();
    const portalAppController = new PortalAppController(pluginRegistry);
    const portalThemeController = new PortalThemeController(pluginRegistry);
    const portalLayoutController = new PortalLayoutController(pluginRegistry);
    const portalRolesController = new PortalRolesController();
    const portalHttpProxyController = new PortalHttpProxyController(pluginRegistry);
    const portalLanguageController = new PortalLanguageController();
    const portalUserController = new PortalUserController();
    const portalLogController = new PortalLogController(pluginRegistry);

    const siteRoutes = express.Router({
        mergeParams: true,
    });
    portalWebapp.use('/:sitePath', siteRoutes);

    const internalRoutes = express.Router({
        mergeParams: true,
    });
    siteRoutes.use(`${PORTAL_INTERNAL_PATH}`, internalRoutes);

    // REST API

    const restApi = express.Router({
        mergeParams: true,
    });
    restApi.use(bodyParser.json());
    internalRoutes.use(PORTAL_APP_API_PATH, restApi);

    restApi.get('/portal-apps', portalAppController.getKnownPortalApps.bind(portalAppController));

    restApi.get('/pages/:pageId/content', portalPageRenderController.getPortalPageContent.bind(portalPageRenderController));
    restApi.get('/pages/:pageId/portal-app-instances', portalPageController.getPortalAppInstances.bind(portalPageController));
    restApi.post('/pages/:pageId/portal-app-instances', portalPageController.addPortalApp.bind(portalPageController));
    restApi.get('/pages/:pageId/portal-app-instances/:pluginName{/:portalAppInstanceId}', portalAppController.getPortalAppSetup.bind(portalAppController));
    restApi.put('/pages/:pageId/portal-app-instances/:pluginName/:portalAppInstanceId', portalPageController.updatePortalApp.bind(portalPageController));
    restApi.delete('/pages/:pageId/portal-app-instances/:pluginName/:portalAppInstanceId', portalPageController.removePortalApp.bind(portalPageController));
    restApi.get('/pages/:pageId/portal-app-instances/:pluginName/:portalAppInstanceId/permittedRoles', portalPageController.getPortalAppPermittedRoles.bind(portalPageController));
    restApi.put('/pages/:pageId/portal-app-instances/:pluginName/:portalAppInstanceId/permittedRoles', portalPageController.updatePortalAppPermittedRoles.bind(portalPageController));

    restApi.get('/pages/:pageId', portalPageController.getPortalPage.bind(portalPageController));
    restApi.post('/pages', portalPageController.addPage.bind(portalPageController));
    restApi.put('/pages/:pageId', portalPageController.updatePage.bind(portalPageController));
    restApi.delete('/pages/:pageId', portalPageController.deletePage.bind(portalPageController));
    restApi.get('/pages/:pageId/permittedRoles', portalPageController.getPagePermittedRoles.bind(portalPageController));
    restApi.put('/pages/:pageId/permittedRoles', portalPageController.updatePagePermittedRoles.bind(portalPageController));

    restApi.get('/sites', portalSiteController.getSites.bind(portalSiteController));
    restApi.get('/sites/:siteId', portalSiteController.getSite.bind(portalSiteController));
    restApi.get('/sites/:siteId/pageTree', portalSiteController.getPageTree.bind(portalSiteController));
    restApi.post('/sites', portalSiteController.addSite.bind(portalSiteController));
    restApi.put('/sites/:siteId', portalSiteController.updateSite.bind(portalSiteController));
    restApi.delete('/sites/:siteId', portalSiteController.deleteSite.bind(portalSiteController));
    restApi.get('/sites/:siteId/permittedRoles', portalSiteController.getSitePermittedRoles.bind(portalSiteController));
    restApi.put('/sites/:siteId/permittedRoles', portalSiteController.updateSitePermittedRoles.bind(portalSiteController));

    restApi.get('/themes', portalThemeController.getAvailablePortalThemes.bind(portalThemeController));
    restApi.get('/layouts', portalLayoutController.getAvailablePortalLayouts.bind(portalLayoutController));
    restApi.get('/roles', portalRolesController.getExistingRoles.bind(portalRolesController));
    restApi.put('/users/authenticated/lang', portalUserController.setAuthenticatedUserLanguage.bind(portalUserController));
    restApi.get('/users/authenticated/authExpiration', portalUserController.getAuthenticatedUserAuthenticationExpirationTime.bind(portalUserController));
    restApi.get('/users/authenticated/timeToAuthExpiration', portalUserController.getAuthenticatedUserTimeToAuthenticationExpiration.bind(portalUserController));
    restApi.get('/logout', portalUserController.logout.bind(portalUserController));
    restApi.get('/languages', portalLanguageController.getAvailableLanguages.bind(portalLanguageController));
    restApi.get('/languages/default', portalLanguageController.getDefaultLanguage.bind(portalLanguageController));

    restApi.post('/log', portalLogController.log.bind(portalLogController));

    // Push updates in dev mode

    const portalPushPluginUpdatesRoute = getPortalPushPluginUpdatesRoute();
    if (portalPushPluginUpdatesRoute) {
        restApi.get('/portal-push-plugin-updates', portalPushPluginUpdatesRoute);
    }

    // Client API resources

    internalRoutes.get(`/${PORTAL_JS_FILE}`, portalResourcesController.getPortalClient.bind(portalResourcesController));
    internalRoutes.get(`/${PORTAL_JS_FILE}.map`, portalResourcesController.getPortalClientMap.bind(portalResourcesController));
    internalRoutes.get(`/${SYSTEMJS_JS_FILE}`, portalResourcesController.getSystemJS.bind(portalResourcesController));

    // Portal theme resources

    const portalThemeResourcesRoutes = express.Router({
        mergeParams: true,
    });
    internalRoutes.use(PORTAL_THEME_RESOURCES_BASE_PATH, portalThemeResourcesRoutes);

    portalThemeResourcesRoutes.get('/:themeName/*"resourcePath"', portalThemeController.getPortalThemeResource.bind(portalThemeController));

    // Page enhancement resources

    const portalPageEnhancementRoutes = express.Router({
        mergeParams: true,
    });
    internalRoutes.use(PORTAL_PAGE_ENHANCEMENT_RESOURCES_BASE_PATH, portalPageEnhancementRoutes);
    portalPageEnhancementRoutes.get('/:pluginName/*"resourcePath"', portalPageEnhancementController.getPortalPageResource.bind(portalPageEnhancementController));

    // Portal app resources

    const portalAppResourcesRoutes = express.Router({
        mergeParams: true,
    });
    internalRoutes.use(PORTAL_APP_RESOURCES_BASE_PATH, portalAppResourcesRoutes);

    portalAppResourcesRoutes.get(`${PORTAL_APP_RESOURCES_SHARED_PATH}/*"typeAndResourcePath"`, portalAppController.getSharedPortalAppResource.bind(portalAppController));
    portalAppResourcesRoutes.get('/:pluginName/*"resourcePath"', portalAppController.getPortalAppResource.bind(portalAppController));

    // Proxy

    const proxyRoutes = express.Router({
        mergeParams: true,
    });
    internalRoutes.use(PORTAL_APP_REST_PROXY_BASE_PATH, proxyRoutes);

    proxyRoutes.all('/*"path"', portalHttpProxyController.forward.bind(portalHttpProxyController));

    // Page route (main)

    siteRoutes.get('*"path"', portalPageRenderController.renderPortalPage.bind(portalPageRenderController));

    // Index

    portalWebapp.get('*"path"', portalIndexController.index.bind(portalPageRenderController));

    return portalWebapp;
};

