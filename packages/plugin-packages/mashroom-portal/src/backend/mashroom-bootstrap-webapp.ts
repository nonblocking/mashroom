
import context, {setPortalPluginConfig} from './context/global_portal_context';
import storageFixture from './storage-fixture';
import setupWebapp from './setup-webapp';
import {startPushPluginUpdates, stopPushPluginUpdates} from './push-plugin-updates';

import type {MashroomWebAppPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {

    const pluginContext = pluginContextHolder.getPluginContext();
    const storageService = pluginContext.services.storage.service;
    const loggerFactory = pluginContext.loggerFactory;
    const logger = loggerFactory('mashroom.portal');

    // Run async
    storageFixture(pluginConfig, pluginContext.serverConfig.name, storageService, loggerFactory);

    setPortalPluginConfig(pluginConfig as any);

    if (pluginContext.serverInfo.devMode) {
        logger.info('Dev mode: The Portal will push plugin updates to the client');
        startPushPluginUpdates(context.pluginRegistry);
        pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
            stopPushPluginUpdates(context.pluginRegistry);
        });
    }

    return setupWebapp(context.pluginRegistry);
};

export default bootstrap;
