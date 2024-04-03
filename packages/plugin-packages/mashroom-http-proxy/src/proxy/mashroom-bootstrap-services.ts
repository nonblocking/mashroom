
import {setPoolConfig} from '../connection-pool';
import context from '../context/global-context';
import {registerHttpAgentMetrics, unregisterHttpAgentMetrics} from '../metrics/http-agent-metrics';
import {registerWsConnectionMetrics, unregisterWsConnectionMetrics} from '../metrics/ws-connection-metrics';
import {registerRequestMetrics, unregisterRequestMetrics} from '../metrics/request-metrics';
import HttpHeaderFilter from './HttpHeaderFilter';
import InterceptorHandler from './InterceptorHandler';
import ProxyImplNodeStreamAPI from './ProxyImplNodeStreamAPI';
import ProxyImplNodeHttpProxy from './ProxyImplNodeHttpProxy';
import MashroomHttpProxyService from './MashroomHttpProxyService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';
import type {Proxy} from '../../type-definitions/internal';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {
        proxyImpl, forwardMethods = [], forwardHeaders = [], rejectUnauthorized,
        /* deprecated */ poolMaxSockets, poolMaxTotalSockets, poolMaxSocketsPerHost, poolMaxWaitingRequestsPerHost,
        socketTimeoutMs, keepAlive, retryOnReset,
        wsMaxConnectionsPerHost, wsMaxConnectionsTotal,
        createForwardedForHeaders,
    } = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();
    const logger = pluginContext.loggerFactory('mashroom.httpProxy');

    setPoolConfig({
        keepAlive,
        maxTotalSockets: poolMaxTotalSockets,
        maxSocketsPerHost: poolMaxSocketsPerHost || /* deprecated */ poolMaxSockets,
        rejectUnauthorized,
    });

    const headerFilter = new HttpHeaderFilter(forwardHeaders);
    const interceptorHandler = new InterceptorHandler(context.pluginRegistry);
    let proxy: Proxy;
    if (proxyImpl === 'nodeHttpProxy') {
        logger.info('Using http-proxy impl based on "node-http-proxy"');
        proxy = new ProxyImplNodeHttpProxy(
            socketTimeoutMs, rejectUnauthorized, interceptorHandler, headerFilter, retryOnReset,
            wsMaxConnectionsPerHost, wsMaxConnectionsTotal, poolMaxWaitingRequestsPerHost, createForwardedForHeaders, pluginContext.loggerFactory);
    } else {
        logger.info('Using (default) proxy impl based on the Node.js Stream API');
        proxy = new ProxyImplNodeStreamAPI(
            socketTimeoutMs, rejectUnauthorized, interceptorHandler, headerFilter, retryOnReset,
            wsMaxConnectionsPerHost, wsMaxConnectionsTotal, poolMaxWaitingRequestsPerHost, createForwardedForHeaders, pluginContext.loggerFactory);
    }
    const service = new MashroomHttpProxyService(forwardMethods, proxy);

    registerHttpAgentMetrics(pluginContextHolder);
    registerWsConnectionMetrics(proxy, pluginContextHolder);
    registerRequestMetrics(proxy, pluginContextHolder);

    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        proxy.shutdown();
        unregisterHttpAgentMetrics();
        unregisterWsConnectionMetrics();
        unregisterRequestMetrics();
    });

    return {
        service,
    };
};

export default bootstrap;
