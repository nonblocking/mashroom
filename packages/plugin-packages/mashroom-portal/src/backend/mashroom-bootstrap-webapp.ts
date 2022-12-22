
import {PORTAL_APP_REST_PROXY_BASE_PATH, PORTAL_INTERNAL_SEPARATOR} from './constants';
import context, {setPortalPluginConfig} from './context/global_portal_context';
import storageFixture from './storage-fixture';
import setupWebapp from './setup-webapp';
import PortalWebSocketProxyController from './controllers/PortalWebSocketProxyController';
import {startPushPluginUpdates, stopPushPluginUpdates} from './push-plugin-updates';

import type {MashroomWebAppPluginBootstrapFunction, MashroomHttpUpgradeHandler} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const httpUpgradeService = pluginContext.services.core.httpUpgradeService;
    const storageService = pluginContext.services.storage!.service;
    const loggerFactory = pluginContext.loggerFactory;
    const logger = loggerFactory('mashroom.portal');

    // Run async
    storageFixture(pluginContext.serverConfig.name, pluginConfig.addDemoPages, storageService, loggerFactory);

    setPortalPluginConfig(pluginConfig as any);

    // Listen for WebSocket upgrades
    const proxyController = new PortalWebSocketProxyController(pluginConfig.path, context.pluginRegistry);
    const proxyUpgradeHandler: MashroomHttpUpgradeHandler = (request, socket, head) => {
        proxyController.forward(request, socket, head);
    };

    httpUpgradeService.registerUpgradeHandler(proxyUpgradeHandler, PORTAL_INTERNAL_SEPARATOR + PORTAL_APP_REST_PROXY_BASE_PATH);
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        httpUpgradeService.unregisterUpgradeHandler(proxyUpgradeHandler);
    });

    // Push plugin changes in dev mode
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
