
import {Router} from 'express';
import infoOverviewRoute from './info-overview-route';
import infoPluginsRoute from './info-plugins-route';
import infoPluginPackagesRoute from './info-plugin-packages-route';
import infoPluginLoadersRoute from './info-plugin-loaders-route';
import infoWebAppsRoute from './info-webapps-route';
import infoApisRoute from './info-apis-route';
import infoServicesRoute from './info-services-route';
import infoMiddlewareStack from './info-middleware-stack';
import infoServer from './info-server-route';
import infoExternalAdminApp from './info-ext-admin-webapp';

const router = Router();

router.get('/', infoOverviewRoute);
router.get('/plugins', infoPluginsRoute);
router.get('/plugin-packages', infoPluginPackagesRoute);
router.get('/plugin-loaders', infoPluginLoadersRoute);
router.get('/middleware', infoMiddlewareStack);
router.get('/webapps', infoWebAppsRoute);
router.get('/apis', infoApisRoute);
router.get('/services', infoServicesRoute);
router.get('/server-info', infoServer);
router.get('/ext/*"extension"', infoExternalAdminApp);

export default router;
