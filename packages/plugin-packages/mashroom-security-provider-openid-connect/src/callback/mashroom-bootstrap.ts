
import {Router} from 'express';
import callbackRoute from './mashroom-openid-connect-callback-route';
import type {MashroomApiPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomApiPluginBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const defaultBackUrl = contextHolder.getPluginContext().serverConfig.indexPage;
    const router = Router();
    router.all('/*"path"', callbackRoute(defaultBackUrl));
    return router;
};

export default bootstrap;
