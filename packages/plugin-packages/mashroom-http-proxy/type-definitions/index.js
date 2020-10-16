// @flow

import type {ExpressRequest, ExpressResponse, MashroomPluginConfig, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';

export type HttpHeaders = {
    [string]: string,
}

export interface MashroomHttpProxyService {

    /**
     * Forwards the given request to the targetUri and passes the response from the target to the response object.
     * The Promise will always resolve, you have to check response.statusCode to see if the transfer was successful or not.
     * The Promise will resolve as soon as the whole response was sent to the client.
     */
    forward(req: ExpressRequest, res: ExpressResponse, targetUri: string, additionalHeaders?: HttpHeaders): Promise<void>;

}

export type MashroomHttpProxyInterceptorResult = {
    addHeaders?: HttpHeaders;
    removeHeaders?: Array<string>;
    rewrittenTargetUri?: string;
    reject?: boolean;
    rejectStatusCode?: number;
    rejectReason?: string;
}

interface MashroomHttpProxyInterceptor {

    /**
     * Intercept a call to given targetUri.
     * The additionalHeaders contain headers already added by the caller and other MashroomHttpProxyInterceptor plugins.
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    intercept(req: ExpressRequest, additionalHeaders: HttpHeaders, targetUri: string): Promise<?MashroomHttpProxyInterceptorResult>;
}

/*
 * Bootstrap method definition for http-proxy-interceptor plugins
 */
export type MashroomHttpProxyInterceptorPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomHttpProxyInterceptor>;


