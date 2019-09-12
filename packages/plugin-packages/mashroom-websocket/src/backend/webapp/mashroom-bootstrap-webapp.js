// @flow

import context from '../context';
import expressApp from './webapp';
import httpUpgradeHandlerFn from './http_upgrade_handler';
import WebSocketServer from '../WebSocketServer';

import type {
    MashroomHttpUpgradeHandler,
    MashroomWebAppPluginBootstrapFunction
} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const { path, restrictToRoles, pingIntervalSec, maxConnections } = pluginConfig;
    const pluginContext = contextHolder.getPluginContext();

    const server = new WebSocketServer(pluginContext.loggerFactory);
    context.server = server;
    context.restrictToRoles = restrictToRoles;
    context.basePath = path;
    context.pingIntervalSec = pingIntervalSec;
    context.maxConnections = maxConnections;

    const upgradeHandler: MashroomHttpUpgradeHandler = httpUpgradeHandlerFn(pluginContext.loggerFactory);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        // Close all connections when the plugin reloads
        server.closeAll();
    });

    return {
        expressApp,
        upgradeHandler,
    };
};

export default bootstrap;
