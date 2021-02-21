
import {Router} from 'express';
import infoOverviewRoute from './info_overview_route';
import infoPluginsRoute from './info_plugins_route';
import infoPluginPackagesRoute from './info_plugin_packages_route';
import infoPluginLoadersRoute from './info_plugin_loaders_route';
import infoWebAppsRoute from './info_webapps_route';
import infoServicesRoute from './info_services_route';
import infoMiddlewareStack from './info_middleware_stack';
import infoServer from './info_server_route';
import infoExternalAdminApp from './info_ext_admin_webapp';

const router = Router();

router.get('/', infoOverviewRoute);
router.get('/plugins', infoPluginsRoute);
router.get('/plugin-packages', infoPluginPackagesRoute);
router.get('/plugin-loaders', infoPluginLoadersRoute);
router.get('/middleware', infoMiddlewareStack);
router.get('/webapps', infoWebAppsRoute);
router.get('/services', infoServicesRoute);
router.get('/server-info', infoServer);
router.get('/ext/*', infoExternalAdminApp);

export default router;
