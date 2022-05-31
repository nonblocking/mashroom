
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
    keepAlive: boolean;
    rejectUnauthorized: boolean;
    maxTotalSockets: number;
}

export type PoolMetrics = {
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
}

export type RequestMetrics = {
    httpRequests: number;
    wsRequests: number;
    targetConnectionErrors: number;
    targetTimeouts: number;
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
    getRequestMetrics():  RequestMetrics;
}
