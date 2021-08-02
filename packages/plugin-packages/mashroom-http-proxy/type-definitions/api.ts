
import type {IncomingMessage} from 'http';
import type {Socket} from 'net';
import type {Request, Response} from 'express';
import type {MashroomPluginConfig, MashroomPluginContextHolder, IncomingMessageWithContext} from '@mashroom/mashroom/type-definitions';

export type HttpHeaders = {
    [name: string]: undefined | string | string[];
}

export type QueryParams = {
    [key: string]: undefined | string | string[];
}

export interface MashroomHttpProxyService {

    /**
     * Forwards the given request to the targetUri and passes the response from the target to the response object.
     * The Promise will always resolve, you have to check response.statusCode to see if the transfer was successful or not.
     * The Promise will resolve as soon as the whole response was sent to the client.
     */
    forward(req: Request, res: Response, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void>;

    /**
     * Forwards a WebSocket request (ws or wss).
     * The passed additional headers are only available at the upgrade/handshake request (most WS frameworks allow you to access it).
     * Proxy interceptors are not applied for WebSockets!
     */
    forwardWs(req: IncomingMessageWithContext, socket: Socket, head: Buffer, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void>;

}

export type MashroomHttpProxyRequestInterceptorResult = {
    addHeaders?: HttpHeaders;
    removeHeaders?: Array<string>;
    addQueryParams?: QueryParams;
    removeQueryParams?: Array<string>;
    rewrittenTargetUri?: string;
    responseHandled?: boolean;
}

export type MashroomHttpProxyResponseInterceptorResult = {
    addHeaders?: HttpHeaders;
    removeHeaders?: Array<string>;
    responseHandled?: boolean;
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
    interceptRequest(targetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>,
                     clientRequest: Request, clientResponse: Response):
        Promise<MashroomHttpProxyRequestInterceptorResult | undefined | null>;

    /**
     * Intercept response from given targetUri.
     *
     * The existingHeaders contain the original request header and the ones already added by other interceptors.
     * targetResponse is the response that shall be forwarded to the client. DO NOT MANIPULATE IT. Just use it to access "statusCode" an such.
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    interceptResponse(targetUri: string, existingHeaders: Readonly<HttpHeaders>, targetResponse: IncomingMessage,
                      clientRequest: Request, clientResponse: Response):
        Promise<MashroomHttpProxyResponseInterceptorResult | undefined | null>;
}

/*
 * Bootstrap method definition for http-proxy-interceptor plugins
 */
export type MashroomHttpProxyInterceptorPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomHttpProxyInterceptor>;


