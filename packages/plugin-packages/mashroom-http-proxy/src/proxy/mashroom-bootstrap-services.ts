
import MashroomHttpProxyService from './MashroomHttpProxyService';
import {setPoolConfig} from '../connection_pool';
import context from '../context/global_context';
import {startExportPoolMetrics, stopExportPoolMetrics} from '../metrics/connection_pool_metrics';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {forwardMethods = [], forwardHeaders = [], rejectUnauthorized, poolMaxSockets, socketTimeoutMs } = pluginConfig;

    setPoolConfig({
        maxSockets: poolMaxSockets,
        rejectUnauthorized,
    })

    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MashroomHttpProxyService(forwardMethods, forwardHeaders, socketTimeoutMs, context.pluginRegistry, pluginContext.loggerFactory);

    startExportPoolMetrics(pluginContextHolder);
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        stopExportPoolMetrics();
    });

    return {
        service,
    };
};

export default bootstrap;
