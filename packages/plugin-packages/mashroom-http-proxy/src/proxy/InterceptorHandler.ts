import type {Transform} from 'stream';
import type {IncomingMessage} from 'http';
import type {Request, Response} from 'express';
import type {MashroomLogger, IncomingMessageWithContext} from '@mashroom/mashroom/type-definitions';
import type {
    HttpHeaders,
    MashroomHttpProxyRequestInterceptorResult,
    MashroomWsProxyRequestInterceptorResult,
    MashroomHttpProxyResponseInterceptorResult,
    QueryParams,
} from '../../type-definitions';
import type {InterceptorHandler as InterceptorHandlerType, MashroomHttpProxyInterceptorRegistry} from '../../type-definitions/internal';

export default class InterceptorHandler implements InterceptorHandlerType {

    constructor(private _interceptorRegistry: MashroomHttpProxyInterceptorRegistry) {
    }

    async processHttpRequest(clientRequest: Request, clientResponse: Response, targetUri: string, additionalHeaders: HttpHeaders, logger: MashroomLogger): Promise<MashroomHttpProxyRequestInterceptorResult> {
        let existingHeaders = {...clientRequest.headers, ...additionalHeaders};
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
        let streamTransformers: Array<Transform> | undefined;

        const interceptors = this._interceptorRegistry.interceptors;
        for (let i = 0; i < interceptors.length; i++) {
            const {pluginName, interceptor} = interceptors[i];
            try {
                const result = await interceptor.interceptRequest?.(rewrittenTargetUri, existingHeaders, existingQueryParams, clientRequest, clientResponse);
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
                    const validHeaders: HttpHeaders = {};
                    Object.keys(result.addHeaders).forEach((name) => {
                        if (result.addHeaders![name]) {
                            validHeaders[name] = result.addHeaders![name];
                        } else {
                            logger.warn(`Ignoring undefined request header '${name}' from interceptor '${pluginName}'`);
                        }
                    });
                    logger.debug(`Interceptor '${pluginName}' added request headers:`, validHeaders);
                    addHeaders = {
                        ...addHeaders,
                        ...validHeaders,
                    };
                    existingHeaders = {
                        ...existingHeaders,
                        ...validHeaders,
                    };
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
                    };
                    existingQueryParams = {
                        ...existingQueryParams,
                        ...result.addQueryParams,
                    };
                }
                if (result?.removeQueryParams && Array.isArray(result.removeQueryParams)) {
                    logger.debug(`Interceptor '${pluginName}' removed query parameters:`, result.removeQueryParams);
                    removeQueryParams = [
                        ...removeQueryParams,
                        ...result.removeQueryParams,
                    ];
                }
                if (result?.streamTransformers) {
                    if (!streamTransformers) {
                        streamTransformers = [];
                    }
                    streamTransformers.push(...result.streamTransformers);
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
            streamTransformers,
        };
    }


    async processWsRequest(clientRequest: IncomingMessageWithContext, targetUri: string, additionalHeaders: HttpHeaders, logger: MashroomLogger): Promise<MashroomWsProxyRequestInterceptorResult> {
        let existingHeaders = {...clientRequest.headers, ...additionalHeaders};

        let addHeaders = {};
        let removeHeaders: Array<string> = [];
        let rewrittenTargetUri = targetUri;
        const interceptors = this._interceptorRegistry.interceptors;
        for (let i = 0; i < interceptors.length; i++) {
            const {pluginName, interceptor} = interceptors[i];
            try {
                const result = await interceptor.interceptWsRequest?.(rewrittenTargetUri, existingHeaders, clientRequest);
                if (result?.rewrittenTargetUri) {
                    logger.info(`Interceptor '${pluginName}' rewrote target URI ${targetUri} to: ${result.rewrittenTargetUri}`);
                    rewrittenTargetUri = result.rewrittenTargetUri;
                }
                if (result?.addHeaders) {
                    const validHeaders: HttpHeaders = {};
                    Object.keys(result.addHeaders).forEach((name) => {
                        if (result.addHeaders![name]) {
                            validHeaders[name] = result.addHeaders![name];
                        } else {
                            logger.warn(`Ignoring undefined request header '${name}' from interceptor '${pluginName}'`);
                        }
                    });
                    logger.debug(`Interceptor '${pluginName}' added request headers:`, validHeaders);
                    addHeaders = {
                        ...addHeaders,
                        ...validHeaders,
                    };
                    existingHeaders = {
                        ...existingHeaders,
                        ...validHeaders,
                    };
                }
                if (result?.removeHeaders && Array.isArray(result.removeHeaders)) {
                    logger.debug(`Interceptor '${pluginName}' removed request headers:`, result.removeHeaders);
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
            removeHeaders,
            rewrittenTargetUri,
        };
    }

    async processHttpResponse(clientRequest: Request, clientResponse: Response, targetUri: string, targetResponse: IncomingMessage, logger: MashroomLogger): Promise<MashroomHttpProxyResponseInterceptorResult> {
        let existingHeaders = {...targetResponse.headers};
        let addHeaders = {};
        let removeHeaders: Array<string> = [];
        let streamTransformers: Array<Transform> | undefined;

        const interceptors = this._interceptorRegistry.interceptors;
        for (let i = 0; i < interceptors.length; i++) {
            const {pluginName, interceptor} = interceptors[i];
            try {
                const result = await interceptor.interceptResponse?.(targetUri, existingHeaders, targetResponse, clientRequest, clientResponse);
                if (result?.responseHandled) {
                    logger.info(`Interceptor '${pluginName}' already handled response to ${targetUri}`);
                    return {
                        responseHandled: true,
                    };
                }
                if (result?.addHeaders) {
                    const validHeaders: HttpHeaders = {};
                    Object.keys(result.addHeaders).forEach((name) => {
                        if (result.addHeaders![name]) {
                            validHeaders[name] = result.addHeaders![name];
                        } else {
                            logger.warn(`Ignoring undefined response header '${name}' from interceptor '${pluginName}'`);
                        }
                    });
                    logger.debug(`Interceptor '${pluginName}' added response headers:`, validHeaders);
                    addHeaders = {
                        ...addHeaders,
                        ...validHeaders,
                    };
                    existingHeaders = {
                        ...existingHeaders,
                        ...validHeaders,
                    };
                }
                if (result?.removeHeaders && Array.isArray(result.removeHeaders)) {
                    logger.debug(`Interceptor '${pluginName}' removed response headers:`, result.removeHeaders);
                    removeHeaders = [
                        ...removeHeaders,
                        ...result.removeHeaders,
                    ];
                }
                if (result?.streamTransformers) {
                    if (!streamTransformers) {
                        streamTransformers = [];
                    }
                    streamTransformers.push(...result.streamTransformers);
                }
            } catch (e) {
                logger.error(`Interceptor ${pluginName} threw an error`, e);
            }
        }

        return {
            addHeaders,
            removeHeaders,
            streamTransformers,
        };
    }

}
