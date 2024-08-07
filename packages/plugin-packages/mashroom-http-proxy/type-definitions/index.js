// @flow

import type {ExpressRequest, ExpressResponse, MashroomPluginConfig, MashroomPluginContextHolder, IncomingMessageWithContext} from '@mashroom/mashroom/type-definitions';
import type {Socket} from 'net';

export type HttpHeaders = {
    [string]: string;
}

export type QueryParams = {
    [key: string]: ?string | string[];
}

export interface MashroomHttpProxyService {

    /**
     * Forwards the given request to the targetUri and passes the response from the target to the response object.
     * The Promise will always resolve, you have to check response.statusCode to see if the transfer was successful or not.
     * The Promise will resolve as soon as the whole response was sent to the client.
     */
    forward(req: ExpressRequest, res: ExpressResponse, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void>;


    /**
     * Forwards a WebSocket request (ws or wss).
     * The passed additional headers are only available at the upgrade/handshake request (most WS frameworks allow you to access it).
     */
    forwardWs(req: IncomingMessageWithContext, socket: Socket, head: Buffer, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void>;
}

export type MashroomHttpProxyRequestInterceptorResult = {
    +addHeaders?: HttpHeaders;
    +removeHeaders?: Array<string>;
    +addQueryParams?: QueryParams;
    +removeQueryParams?: Array<string>;
    +rewrittenTargetUri?: string;
    +responseHandled?: boolean;
    +streamTransformers?: Array<any>;
}

export type MashroomWsProxyRequestInterceptorResult = {
    +addHeaders?: HttpHeaders;
    +removeHeaders?: Array<string>;
    +rewrittenTargetUri?: string;
}

export type MashroomHttpProxyResponseInterceptorResult = {
    +addHeaders?: HttpHeaders;
    +removeHeaders?: Array<string>;
    +responseHandled?: boolean;
    +streamTransformers?: Array<any>;
}

export interface MashroomHttpProxyInterceptor {

    /**
     * Intercept request to given targetUri.
     *
     * The existingHeaders contain the original request headers, headers added by the MashroomHttpProxyService client and the ones already added by other interceptors.
     * The existingQueryParams contain query parameters from the request and the ones already added by other interceptors.
     *
     * clientRequest is the request that shall be forwarded. DO NOT MANIPULATE IT. Just use it to access "method" and "pluginContext".
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    interceptRequest?: (targetUri: string, existingHeaders: HttpHeaders, existingQueryParams: QueryParams,
                     clientRequest: ExpressRequest, clientResponse: ExpressResponse)
        => Promise<?MashroomHttpProxyRequestInterceptorResult>;

    /**
     * Intercept WebSocket request to given targetUri.
     *
     * The existingHeaders contain the original request headers, headers added by the MashroomHttpProxyService client and the ones already added by other interceptors.
     *
     * The changes are ONLY applied to the upgrade request, not to WebSocket messages.
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    interceptWsRequest?: (targetUri: string, existingHeaders: HttpHeaders, clientRequest: IncomingMessageWithContext)
        => Promise<?MashroomWsProxyRequestInterceptorResult>;

    /**
     * Intercept response from given targetUri.
     *
     * The existingHeaders contain the original request header and the ones already added by other interceptors.
     * targetResponse is the response that shall be forwarded to the client. DO NOT MANIPULATE IT. Just use it to access "statusCode" and such.
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    interceptResponse?: (targetUri: string, existingHeaders: HttpHeaders, targetResponse: http$IncomingMessage<>, clientRequest: ExpressRequest, clientResponse: ExpressResponse)
        => Promise<?MashroomHttpProxyResponseInterceptorResult>;
}


/*
 * Bootstrap method definition for http-proxy-interceptor plugins
 */
export type MashroomHttpProxyInterceptorPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomHttpProxyInterceptor>;


