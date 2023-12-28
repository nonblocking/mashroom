
import type {IncomingHttpHeaders, IncomingMessage} from 'http';
import type {Socket} from 'net';
import type {Request, Response} from 'express';
import type {ParsedQs} from 'qs';
import type {MashroomLogger, IncomingMessageWithContext} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomHttpProxyInterceptor, MashroomHttpProxyResponseInterceptorResult, HttpHeaders, MashroomHttpProxyRequestInterceptorResult, MashroomWsProxyRequestInterceptorResult} from './api';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            mashroomRequestMeta?: ProxyRequestMeta;
        }
    }
}

export interface HttpHeaderFilter {
    removeUnwantedHeaders(headers: IncomingHttpHeaders): void;
    filter(headers: IncomingHttpHeaders): HttpHeaders;
}

export type PoolConfig = {
    readonly keepAlive: boolean;
    readonly rejectUnauthorized: boolean;
    readonly maxSocketsPerHost: number;
    readonly maxTotalSockets: number | null;
}


export type RequestMetrics = {
    httpRequestCountTotal: number;
    httpRequestTargetCount: Record<string, number>;
    httpConnectionErrorCountTotal: number;
    httpConnectionErrorTargetCount: Record<string, number>;
    httpTimeoutCountTotal: number;
    httpTimeoutTargetCount: Record<string, number>;
    wsRequestCountTotal: number;
    wsRequestTargetCount: Record<string, number>;
    wsConnectionErrorCountTotal: number;
    wsConnectionErrorTargetCount: Record<string, number>;
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

export type ProxyRequestMeta = {
    readonly startTime: [number, number];
    readonly uri: string;
    readonly additionalQueryParams: ParsedQs;
    readonly type: 'HTTP' | 'WS';
    readonly user: MashroomSecurityUser | undefined | null;
    retries: number;
    readonly retry: () => void;
    readonly end: () => void;
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
