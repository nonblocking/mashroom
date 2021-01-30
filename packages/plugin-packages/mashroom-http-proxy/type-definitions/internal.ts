
import type {IncomingHttpHeaders, IncomingMessage} from 'http';
import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomHttpProxyInterceptor, MashroomHttpProxyResponseInterceptorResult, HttpHeaders, MashroomHttpProxyRequestInterceptorResult} from './api';

export interface HttpHeaderFilter {
    filter(headers: IncomingHttpHeaders): void;
}

export type PoolConfig = {
    rejectUnauthorized: boolean;
    maxSockets: number;
}

export type PoolStats = {
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
}

export type MashroomHttpProxyInterceptorHolder = {
    readonly order: number;
    readonly pluginName: string;
    readonly interceptor: MashroomHttpProxyInterceptor;
}

export interface MashroomHttpProxyInterceptorRegistry {
    readonly interceptors: Array<MashroomHttpProxyInterceptorHolder>;
    register(order: number, pluginName: string, interceptor: MashroomHttpProxyInterceptor): void;
    unregister(pluginName: string): void;
}

export interface InterceptorHandler {
    processRequest(clientRequest: ExpressRequest, clientResponse: ExpressResponse,
                   targetUri: string, additionalHeaders: HttpHeaders, logger: MashroomLogger):
        Promise<MashroomHttpProxyRequestInterceptorResult>;
    processResponse(clientRequest: ExpressRequest, clientResponse: ExpressResponse, targetUri: string,
                    targetResponse: IncomingMessage, logger: MashroomLogger):
        Promise<MashroomHttpProxyResponseInterceptorResult>;
}

export interface Proxy {
    forward(req: ExpressRequest, res: ExpressResponse, uri: string, additionalHeaders: HttpHeaders): Promise<void>;
    shutdown(): void;
}
