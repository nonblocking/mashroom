// @flow

import context, {setPortalPluginConfig} from './context/global_portal_context';
import storageFixture from './storage-fixture';

import type {MashroomWebAppPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {

    const pluginContext = pluginContextHolder.getPluginContext();
    const storageService = pluginContext.services.storage.service;
    const loggerFactory = pluginContext.loggerFactory;

    // Run async
    storageFixture(pluginConfig, pluginContext.serverConfig.name, storageService, loggerFactory);

    setPortalPluginConfig(pluginConfig);

    return context.portalWebapp;
};

export default bootstrap;
