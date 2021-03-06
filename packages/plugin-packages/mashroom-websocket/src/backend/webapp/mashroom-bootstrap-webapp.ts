
import context from '../context';
import expressApp from './webapp';
import httpUpgradeHandlerFn from './http_upgrade_handler';
import WebSocketServer from '../WebSocketServer';
import {
    startExportConnectionMetrics,
    stopExportConnectionMetrics
} from '../metrics/connection_metrics';

import type {
    MashroomHttpUpgradeHandler,
    MashroomWebAppPluginBootstrapFunction
} from '@mashroom/mashroom/type-definitions';
import ReconnectMessageBufferStore from './ReconnectMessageBufferStore';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { path, restrictToRoles, enableKeepAlive, keepAliveIntervalSec, maxConnections, reconnectMessageBufferFolder, reconnectTimeoutSec } = pluginConfig;
    const {loggerFactory, serverConfig, services} = pluginContextHolder.getPluginContext();

    context.restrictToRoles = restrictToRoles;
    context.basePath = path;
    context.enableKeepAlive = enableKeepAlive;
    context.keepAliveIntervalSec = keepAliveIntervalSec;
    context.reconnectTimeoutSec = reconnectTimeoutSec;
    context.maxConnections = maxConnections;

    const reconnectMessageBufferStore = new ReconnectMessageBufferStore(reconnectMessageBufferFolder, serverConfig.serverRootFolder, loggerFactory);
    context.server = new WebSocketServer(loggerFactory, reconnectMessageBufferStore);

    const upgradeHandler: MashroomHttpUpgradeHandler = httpUpgradeHandlerFn();

    startExportConnectionMetrics(context.server, pluginContextHolder);

    services.core.pluginService.onUnloadOnce(pluginName, () => {
        // Close all connections when the plugin reloads
        context.server.closeAll();
        stopExportConnectionMetrics();
    });

    return {
        expressApp,
        upgradeHandler,
    };
};

export default bootstrap;
