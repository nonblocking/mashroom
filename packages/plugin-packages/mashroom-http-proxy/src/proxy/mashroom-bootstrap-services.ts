
import HttpHeaderFilter from './HttpHeaderFilter';
import InterceptorHandler from './InterceptorHandler';
import ProxyImplRequest from './ProxyImplRequest';
import MashroomHttpProxyService from './MashroomHttpProxyService';
import {setPoolConfig} from '../connection_pool';
import context from '../context/global_context';
import {startExportPoolMetrics, stopExportPoolMetrics} from '../metrics/connection_pool_metrics';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {proxyImpl, forwardMethods = [], forwardHeaders = [], rejectUnauthorized, poolMaxSockets, socketTimeoutMs} = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();

    setPoolConfig({
        maxSockets: poolMaxSockets,
        rejectUnauthorized,
    });

    const headerFilter = new HttpHeaderFilter(forwardHeaders);
    const interceptorHandler = new InterceptorHandler(context.pluginRegistry);
    const proxy = new ProxyImplRequest(socketTimeoutMs, interceptorHandler, headerFilter, pluginContext.loggerFactory);
    const service = new MashroomHttpProxyService(forwardMethods, proxy);

    startExportPoolMetrics(pluginContextHolder);
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        proxy.shutdown();
        stopExportPoolMetrics();
    });

    return {
        service,
    };
};

export default bootstrap;
