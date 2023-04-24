
import {setPoolConfig} from '../connection_pool';
import context from '../context/global_context';
import {startExportHttpPoolMetrics, stopExportHttpPoolMetrics} from '../metrics/http_pool_metrics';
import {startExportWsConnectionMetrics, stopExportWsConnectionMetrics} from '../metrics/ws_connection_metrics';
import {startExportRequestMetrics, stopExportRequestMetrics} from '../metrics/request_metrics';
import HttpHeaderFilter from './HttpHeaderFilter';
import InterceptorHandler from './InterceptorHandler';
import ProxyImplRequest from './ProxyImplRequest';
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
    if (proxyImpl === 'request') {
        logger.info('Using http-proxy impl based on "request"');
        proxy = new ProxyImplRequest(socketTimeoutMs, interceptorHandler, headerFilter, retryOnReset, pluginContext.loggerFactory);
    } else {
        logger.info('Using http-proxy impl based on "node-http-proxy"');
        proxy = new ProxyImplNodeHttpProxy(
            socketTimeoutMs, rejectUnauthorized, interceptorHandler, headerFilter, retryOnReset,
            wsMaxConnectionsPerHost, wsMaxConnectionsTotal, pluginContext.loggerFactory);
    }
    const service = new MashroomHttpProxyService(forwardMethods, proxy, poolMaxWaitingRequestsPerHost);

    startExportHttpPoolMetrics(pluginContextHolder);
    startExportWsConnectionMetrics(proxy, pluginContextHolder);
    startExportRequestMetrics(proxy, pluginContextHolder);
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        proxy.shutdown();
        stopExportHttpPoolMetrics();
        stopExportWsConnectionMetrics();
        stopExportRequestMetrics();
    });

    return {
        service,
    };
};

export default bootstrap;
