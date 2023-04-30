
import setupDefaultMetrics from './setup-default-metrics';
import expressAppFactory from './webapp';

import {startSyncRegistry, stopSyncRegistry} from './registry';
import {startPM2Connector, stopPM2Connector} from './pm2-cluster-connector';
import type { MashroomWebAppPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const pluginContext = contextHolder.getPluginContext();
    const loggerFactory = pluginContext.loggerFactory;

    setupDefaultMetrics(loggerFactory);

    startSyncRegistry(contextHolder);
    startPM2Connector(pluginContext);
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        stopSyncRegistry();
        stopPM2Connector();
    });

    return expressAppFactory();
};

export default bootstrap;
