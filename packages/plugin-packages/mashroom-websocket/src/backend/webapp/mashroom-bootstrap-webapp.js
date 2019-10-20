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
    const { path, restrictToRoles, enableKeepAlive, keepAliveIntervalSec, maxConnections } = pluginConfig;
    const pluginContext = contextHolder.getPluginContext();

    context.restrictToRoles = restrictToRoles;
    context.basePath = path;
    context.enableKeepAlive = enableKeepAlive;
    context.keepAliveIntervalSec = keepAliveIntervalSec;
    context.maxConnections = maxConnections;
    context.server = new WebSocketServer(pluginContext.loggerFactory);

    const upgradeHandler: MashroomHttpUpgradeHandler = httpUpgradeHandlerFn();

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        // Close all connections when the plugin reloads
        context.server.closeAll();
    });

    return {
        expressApp,
        upgradeHandler,
    };
};

export default bootstrap;
