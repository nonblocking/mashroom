import express from 'express';
import {MashroomApiPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';
import callbackRoute from './mashroom-openid-connect-callback-route';

const bootstrap: MashroomApiPluginBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const defaultBackUrl = contextHolder.getPluginContext().serverConfig.indexPage;
    const router = express.Router();
    // @ts-ignore
    router.all('/*', callbackRoute(defaultBackUrl));
    return router;
};

export default bootstrap;
