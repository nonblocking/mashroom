
import type {IncomingHttpHeaders, IncomingMessage} from 'http';
import type {Socket} from 'net';
import type {Request, Response} from 'express';
import type {MashroomLogger, IncomingMessageWithContext} from '@mashroom/mashroom/type-definitions';
import type {MashroomHttpProxyInterceptor, MashroomHttpProxyResponseInterceptorResult, HttpHeaders, MashroomHttpProxyRequestInterceptorResult} from './api';
import {MashroomWsProxyRequestInterceptorResult} from './api';

export interface HttpHeaderFilter {
    filter(headers: IncomingHttpHeaders): void;
}

export type PoolConfig = {
    readonly keepAlive: boolean;
    readonly rejectUnauthorized: boolean;
    readonly maxSocketsPerHost: number;
    readonly maxTotalSockets: number | null;
}

export type PoolMetrics = {
    readonly activeConnections: number;
    readonly activeConnectionsTargetCount: Record<string, number>;
    readonly idleConnections: number;
    readonly waitingRequests: number;
    readonly waitingRequestsTargetCount: Record<string, number>;
}

export type RequestMetrics = {
    httpRequestCount: number;
    httpTargetConnectionErrorCount: number;
    httpTargetTimeoutCount: number;
    wsRequestCount: number;
}

export type WSConnectionMetrics = {
    activeConnections: number;
    activeConnectionsTargetCount: Record<string, number>;
}

export type MashroomHttpProxyInterceptorHolder = {
    readonly order: number;
    readonly pluginName: string;
    readonly interceptor: MashroomHttpProxyInterceptor;
}

export interface MashroomHttpProxyInterceptorRegistry {
    readonly interceptors: Readonly<Array<MashroomHttpProxyInterceptorHolder>>;
    register(order: number, pluginName: string, interceptor: MashroomHttpProxyInterceptor): void;
    unregister(pluginName: string): void;
}

export interface InterceptorHandler {
    processHttpRequest(clientRequest: Request, clientResponse: Response,
                   targetUri: string, additionalHeaders: HttpHeaders, logger: MashroomLogger):
        Promise<MashroomHttpProxyRequestInterceptorResult>;
    processWsRequest(clientRequest: IncomingMessageWithContext, targetUri: string, additionalHeaders: HttpHeaders, logger: MashroomLogger):
        Promise<MashroomWsProxyRequestInterceptorResult>;
    processHttpResponse(clientRequest: Request, clientResponse: Response, targetUri: string,
                    targetResponse: IncomingMessage, logger: MashroomLogger):
        Promise<MashroomHttpProxyResponseInterceptorResult>;
}

export interface Proxy {
    forward(req: Request, res: Response, targetUri: string, additionalHeaders: HttpHeaders): Promise<void>;
    forwardWs(req: IncomingMessageWithContext, socket: Socket, head: Buffer, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void>;
    shutdown(): void;
    getRequestMetrics(): RequestMetrics;
    getWSConnectionMetrics(): WSConnectionMetrics | null;
}
