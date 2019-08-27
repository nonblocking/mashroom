// @flow

import express from 'express';
import bodyParser from 'body-parser';

import MashroomPortalPluginRegistry from './plugins/MashroomPortalPluginRegistry';
import PortalResourcesController from './controllers/PortalResourcesController';
import PortalPageController from './controllers/PortalPageController';
import PortalPageRenderController from './controllers/PortalPageRenderController';
import PortalSiteController from './controllers/PortalSiteController';
import PortalAppController from './controllers/PortalAppController';
import PortalThemeController from './controllers/PortalThemeController';
import PortalLayoutController from './controllers/PortalLayoutController';
import PortalRolesController from './controllers/PortalRolesController';
import PortalRestProxyController from './controllers/PortalRestProxyController';
import PortalLanguageController from './controllers/PortalLanguageController';
import PortalUserController from './controllers/PortalUserController';
import PortalLogController from './controllers/PortalLogController';
import {
    PORTAL_APP_API_PATH,
    PORTAL_APP_RESOURCES_BASE_PATH,
    PORTAL_APP_RESOURCES_GLOBAL_PATH,
    PORTAL_APP_REST_PROXY_BASE_PATH,
    PORTAL_JS_FILE,
    PORTAL_PRIVATE_PATH,
    PORTAL_THEME_RESOURCES_BASE_PATH
} from './constants';

export default (pluginRegistry: MashroomPortalPluginRegistry, startTimestamp: number) => {
    const portalWebapp = express();

    portalWebapp.enable('etag');

    const portalResourcesController = new PortalResourcesController();
    const portalPageController = new PortalPageController(pluginRegistry);
    const portalPageRenderController = new PortalPageRenderController(portalWebapp, pluginRegistry, startTimestamp);
    const portalSiteController = new PortalSiteController();
    const portalAppController = new PortalAppController(pluginRegistry);
    const portalThemeController = new PortalThemeController(pluginRegistry);
    const portalLayoutController = new PortalLayoutController(pluginRegistry);
    const portalRolesController = new PortalRolesController();
    const portalRestProxyController = new PortalRestProxyController(pluginRegistry);
    const portalLanguageController = new PortalLanguageController();
    const portalUserController = new PortalUserController();
    const portalLogController = new PortalLogController(pluginRegistry);

    const privateRoutes = express.Router();
    portalWebapp.use(PORTAL_PRIVATE_PATH, privateRoutes);

    // REST API

    const restApi = express.Router();
    restApi.use(bodyParser.json());
    privateRoutes.use(PORTAL_APP_API_PATH, restApi);

    restApi.get('/portal-apps', portalAppController.getAvailablePortalApps.bind(portalAppController));

    restApi.get('/pages/:pageId/portal-app-instances', portalPageController.getPortalAppInstances.bind(portalPageController));
    restApi.post('/pages/:pageId/portal-app-instances', portalPageController.addPortalApp.bind(portalPageController));
    restApi.get('/pages/:pageId/portal-app-instances/:pluginName/:portalAppInstanceId?', portalAppController.getPortalAppSetup.bind(portalAppController));
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
    restApi.get('/users/authenticated/authExpiration', portalUserController.getAuthenticatedUserAuthenticationExpiration.bind(portalUserController));
    restApi.get('/logout', portalUserController.logout.bind(portalUserController));
    restApi.get('/languages', portalLanguageController.getAvailableLanguages.bind(portalLanguageController));
    restApi.get('/languages/default', portalLanguageController.getDefaultLanguage.bind(portalLanguageController));

    restApi.post('/log', portalLogController.log.bind(portalLogController));

    // Client API resources

    privateRoutes.get(`/${PORTAL_JS_FILE}`, portalResourcesController.getPortalClient.bind(portalResourcesController));

    // Portal theme resources

    const portalThemeResourcesRoutes = express.Router();
    portalThemeResourcesRoutes.get(`/:themeName/*`, portalThemeController.getPortalThemeResource.bind(portalThemeController));
    privateRoutes.use(PORTAL_THEME_RESOURCES_BASE_PATH, portalThemeResourcesRoutes);

    // Portal app resources

    const portalAppResourcesRoutes = express.Router();
    portalAppResourcesRoutes.get(`${PORTAL_APP_RESOURCES_GLOBAL_PATH}/*`, portalAppController.getGlobalPortalAppResource.bind(portalAppController));
    portalAppResourcesRoutes.get('/:pluginName/*', portalAppController.getPortalAppResource.bind(portalAppController));
    privateRoutes.use(PORTAL_APP_RESOURCES_BASE_PATH, portalAppResourcesRoutes);

    // Proxy

    const proxyRoutes = express.Router();
    proxyRoutes.all(`/*`, portalRestProxyController.forward.bind(portalRestProxyController));
    privateRoutes.use(PORTAL_APP_REST_PROXY_BASE_PATH, proxyRoutes);

    // Page route (main)

    portalWebapp.get('*', portalPageRenderController.renderPortalPage.bind(portalPageRenderController));

    return portalWebapp;
};

