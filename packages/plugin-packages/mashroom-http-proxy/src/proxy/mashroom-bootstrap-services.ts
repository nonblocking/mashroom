
import MashroomHttpProxyService from './MashroomHttpProxyService';
import {setPoolConfig} from '../connection_pool';
import {startExportPoolMetrics, stopExportPoolMetrics} from '../metrics/connection_pool_metrics';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {forwardMethods = [], forwardHeaders = [], rejectUnauthorized, poolMaxSockets, socketTimeoutMs } = pluginConfig;

    setPoolConfig({
        maxSockets: poolMaxSockets,
        socketTimeoutMs,
        rejectUnauthorized,
    })

    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MashroomHttpProxyService(forwardMethods, forwardHeaders, pluginContext.loggerFactory);

    startExportPoolMetrics(pluginContextHolder);
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        stopExportPoolMetrics();
    });

    return {
        service,
    };
};

export default bootstrap;
