
import type {IncomingMessage} from 'http';
import type {Request, Response} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {
    HttpHeaders,
    MashroomHttpProxyRequestInterceptorResult,
    MashroomHttpProxyResponseInterceptorResult,
    QueryParams
} from '../../type-definitions';
import type {InterceptorHandler as InterceptorHandlerType, MashroomHttpProxyInterceptorRegistry} from '../../type-definitions/internal';

export default class InterceptorHandler implements InterceptorHandlerType {

    constructor(private _interceptorRegistry: MashroomHttpProxyInterceptorRegistry) {
    }

    async processRequest(clientRequest: Request, clientResponse: Response, targetUri: string, additionalHeaders: HttpHeaders, logger: MashroomLogger): Promise<MashroomHttpProxyRequestInterceptorResult> {
        let existingHeaders = { ...clientRequest.headers, ...additionalHeaders };
        let existingQueryParams: QueryParams = {};
        Object.keys(clientRequest.query || {}).forEach((queryKey) => {
            const queryValue = clientRequest.query[queryKey];
            if (Array.isArray(queryValue)) {
                existingQueryParams[queryKey] = (queryValue as Array<any>).map((v) => v.toString());
            } else {
                existingQueryParams[queryKey] = queryValue?.toString();
            }
        });

        let addHeaders = {};
        let removeHeaders: Array<string> = [];
        let addQueryParams = {};
        let removeQueryParams: Array<string> = [];
        let rewrittenTargetUri = targetUri;
        const interceptors = this._interceptorRegistry.interceptors;
        for (let i = 0; i < interceptors.length; i++) {
            const {pluginName, interceptor} = interceptors[i];
            try {
                const result = await interceptor.interceptRequest(rewrittenTargetUri, existingHeaders, existingQueryParams, clientRequest, clientResponse);
                if (result?.responseHandled) {
                    logger.info(`Interceptor '${pluginName}' already handled response to ${targetUri}`);
                    return {
                        responseHandled: true,
                    };
                }
                if (result?.rewrittenTargetUri) {
                    logger.info(`Interceptor '${pluginName}' rewrote target URI ${targetUri} to: ${result.rewrittenTargetUri}`);
                    rewrittenTargetUri = result.rewrittenTargetUri;
                }
                if (result?.addHeaders) {
                    logger.debug(`Interceptor '${pluginName}' added request headers:`, result.addHeaders);
                    addHeaders = {
                        ...addHeaders,
                        ...result.addHeaders,
                    }
                    existingHeaders = {
                        ...existingHeaders,
                        ...result.addHeaders,
                    }
                }
                if (result?.removeHeaders && Array.isArray(result.removeHeaders)) {
                    logger.debug(`Interceptor '${pluginName}' removed request headers:`, result.removeHeaders);
                    removeHeaders = [
                        ...removeHeaders,
                        ...result.removeHeaders,
                    ];
                }
                if (result?.addQueryParams) {
                    logger.debug(`Interceptor '${pluginName}' added query parameters:`, result.addQueryParams);
                    addQueryParams = {
                        ...addQueryParams,
                        ...result.addQueryParams,
                    }
                    existingQueryParams = {
                        ...existingQueryParams,
                        ...result.addQueryParams,
                    }
                }
                if (result?.removeQueryParams && Array.isArray(result.removeQueryParams)) {
                    logger.debug(`Interceptor '${pluginName}' removed query parameters:`, result.removeQueryParams);
                    removeQueryParams = [
                        ...removeQueryParams,
                        ...result.removeQueryParams,
                    ];
                }
            } catch (e) {
                logger.error(`Interceptor ${pluginName} threw an error`, e);
            }
        }

        return {
            addHeaders,
            removeHeaders,
            addQueryParams,
            removeQueryParams,
            rewrittenTargetUri,
        }
    }

    async processResponse(clientRequest: Request, clientResponse: Response, targetUri: string, targetResponse: IncomingMessage, logger: MashroomLogger): Promise<MashroomHttpProxyResponseInterceptorResult> {
        let existingHeaders = { ...targetResponse.headers };
        let addHeaders = {};
        let removeHeaders: Array<string> = [];
        const interceptors = this._interceptorRegistry.interceptors;
        for (let i = 0; i < interceptors.length; i++) {
            const {pluginName, interceptor} = interceptors[i];
            try {
                const result = await interceptor.interceptResponse(targetUri, existingHeaders, targetResponse, clientRequest, clientResponse);
                if (result?.responseHandled) {
                    logger.info(`Interceptor '${pluginName}' already handled response to ${targetUri}`);
                    return {
                        responseHandled: true,
                    };
                }
                if (result?.addHeaders) {
                    logger.debug(`Interceptor '${pluginName}' added response headers:`, result.addHeaders);
                    addHeaders = {
                        ...addHeaders,
                        ...result.addHeaders,
                    }
                    existingHeaders = {
                        ...existingHeaders,
                        ...result.addHeaders,
                    }
                }
                if (result?.removeHeaders && Array.isArray(result.removeHeaders)) {
                    logger.debug(`Interceptor '${pluginName}' removed response headers:`, result.removeHeaders);
                    removeHeaders = [
                        ...removeHeaders,
                        ...result.removeHeaders,
                    ];
                }
            } catch (e) {
                logger.error(`Interceptor ${pluginName} threw an error`, e);
            }
        }

        return {
            addHeaders,
            removeHeaders
        }
    }

}
