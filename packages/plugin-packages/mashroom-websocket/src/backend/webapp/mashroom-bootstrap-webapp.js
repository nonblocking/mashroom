// @flow

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
import TemporaryFileStore from './tempStore';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { path, restrictToRoles, enableKeepAlive, keepAliveIntervalSec, maxConnections, tmpFileStorePath } = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    context.restrictToRoles = restrictToRoles;
    context.basePath = path;
    context.enableKeepAlive = enableKeepAlive;
    context.keepAliveIntervalSec = keepAliveIntervalSec;
    context.maxConnections = maxConnections;
    const tmpFileStore = new TemporaryFileStore(tmpFileStorePath);
    context.server = new WebSocketServer(pluginContext.loggerFactory, tmpFileStore);

    const upgradeHandler: MashroomHttpUpgradeHandler = httpUpgradeHandlerFn();

    startExportConnectionMetrics(context.server, pluginContextHolder);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
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
