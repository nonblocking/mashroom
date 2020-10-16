
import type {
    ExpressRequest,
    ExpressResponse,
    MashroomPluginConfig,
    MashroomPluginContextHolder
} from '@mashroom/mashroom/type-definitions';

export type HttpHeaders = {
    [name: string]: undefined | string | string[];
}

export type QueryParams = {
    [key: string]: undefined | string | string[] | {};
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
    addQueryParams?: QueryParams;
    removeQueryParams?: Array<string>;
    rewrittenTargetUri?: string;
    reject?: boolean;
    rejectStatusCode?: number;
    rejectReason?: string;
}

interface MashroomHttpProxyInterceptor {

    /**
     * Intercept HTTP proxy call to given targetUri.
     *
     * The existingHeaders contain the (filtered!) request headers, headers added by the MashroomHttpProxyService client and the ones already added by other interceptors.
     * The existingQueryParams contain query parameters from the request and the ones already added by other interceptors.
     *
     * req is the request that shall be forwarded. DO NOT MANIPULATE IT. Just use it to access req.method and req.pluginContext.
     *
     * Return null or undefined if you don't want to interfere with a call.
     */
    intercept(targetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>, req: Readonly<ExpressRequest>): Promise<MashroomHttpProxyInterceptorResult | undefined | null>;
}

/*
 * Bootstrap method definition for http-proxy-interceptor plugins
 */
export type MashroomHttpProxyInterceptorPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) => Promise<MashroomHttpProxyInterceptor>;


