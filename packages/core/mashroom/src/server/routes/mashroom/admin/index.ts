
import {Router} from 'express';
import infoOverviewRoute from './info_overview_route';
import infoPluginsRoute from './info_plugins_route';
import infoWebAppsRoute from './info_webapps_route';
import infoServicesRoute from './info_services_route';
import infoMiddlewareStack from './info_middleware_stack';

const router = Router();

router.get('/', infoOverviewRoute);
router.get('/plugins', infoPluginsRoute);
router.get('/middleware', infoMiddlewareStack);
router.get('/webapps', infoWebAppsRoute);
router.get('/services', infoServicesRoute);

export default router;
