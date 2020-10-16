
import type {IncomingHttpHeaders} from 'http';
import type {MashroomHttpProxyInterceptor} from './api';

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
    readonly pluginName: string;
    readonly interceptor: MashroomHttpProxyInterceptor;
}

export interface MashroomHttpProxyInterceptorRegistry {
    readonly interceptors: Array<MashroomHttpProxyInterceptorHolder>;
    register(pluginName: string, interceptor: MashroomHttpProxyInterceptor): void;
    unregister(pluginName: string): void;
}
