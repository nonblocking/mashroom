
import type {IncomingMessage} from 'http';
import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders, MashroomHttpProxyRequestInterceptorResult, MashroomHttpProxyResponseInterceptorResult} from '../../type-definitions';
import type {InterceptorHandler as InterceptorHandlerType, MashroomHttpProxyInterceptorRegistry} from '../../type-definitions/internal';
import {MashroomHttpProxyInterceptor} from '../../type-definitions';

export default class InterceptorHandler implements InterceptorHandlerType {

    constructor(private interceptorRegistry: MashroomHttpProxyInterceptorRegistry) {
    }

    anyHandlersWantToIntercept(clientRequest: ExpressRequest, targetUri: string): boolean {
        return this.interceptorRegistry.interceptors.some((holder) => this.wantToIntercept(holder.interceptor, clientRequest, targetUri));
    }

    async processRequest(clientRequest: ExpressRequest, clientResponse: ExpressResponse, targetUri: string, additionalHeaders: HttpHeaders, logger: MashroomLogger): Promise<MashroomHttpProxyRequestInterceptorResult> {
        let existingHeaders = { ...clientRequest.headers, ...additionalHeaders };
        let existingQueryParams = { ...clientRequest.query };
        let addHeaders = {};
        let removeHeaders: Array<string> = [];
        let addQueryParams = {};
        let removeQueryParams: Array<string> = [];
        let rewrittenTargetUri = targetUri;
        const interceptors = this.interceptorRegistry.interceptors;
        for (let i = 0; i < interceptors.length; i++) {
            const {pluginName, interceptor} = interceptors[i];
            if (this.wantToIntercept(interceptor, clientRequest, targetUri)) {
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
                        logger.debug(`Interceptor '${pluginName}' added HTTP headers:`, result.addHeaders);
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
                        logger.debug(`Interceptor '${pluginName}' removed HTTP headers:`, result.removeHeaders);
                        removeHeaders = [
                            ...removeHeaders,
                            ...result.removeHeaders,
                        ];
                    }
                    if (result?.addQueryParams) {
                        logger.debug(`Interceptor '${pluginName}' added HTTP query parameters:`, result.addQueryParams);
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
                        logger.debug(`Interceptor '${pluginName}' removed HTTP query parameters:`, result.removeQueryParams);
                        removeQueryParams = [
                            ...removeQueryParams,
                            ...result.removeQueryParams,
                        ];
                    }
                } catch (e) {
                    logger.error(`Interceptor ${pluginName} threw an error`, e);
                }
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

    async processResponse(clientRequest: ExpressRequest, clientResponse: ExpressResponse, targetUri: string, targetResponse: IncomingMessage, logger: MashroomLogger): Promise<MashroomHttpProxyResponseInterceptorResult> {
        let existingHeaders = { ...targetResponse.headers };
        let addHeaders = {};
        let removeHeaders: Array<string> = [];
        const interceptors = this.interceptorRegistry.interceptors;
        for (let i = 0; i < interceptors.length; i++) {
            const {pluginName, interceptor} = interceptors[i];
            if (this.wantToIntercept(interceptor, clientRequest, targetUri)) {
                try {
                    const result = await interceptor.interceptResponse(targetUri, existingHeaders, targetResponse, clientRequest, clientResponse);
                    if (result?.responseHandled) {
                        logger.info(`Interceptor '${pluginName}' already handled response to ${targetUri}`);
                        return {
                            responseHandled: true,
                        };
                    }
                    if (result?.addHeaders) {
                        logger.debug(`Interceptor '${pluginName}' added HTTP headers:`, result.addHeaders);
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
                        logger.debug(`Interceptor '${pluginName}' removed HTTP headers:`, result.removeHeaders);
                        removeHeaders = [
                            ...removeHeaders,
                            ...result.removeHeaders,
                        ];
                    }
                } catch (e) {
                    logger.error(`Interceptor ${pluginName} threw an error`, e);
                }
            }
        }

        return {
            addHeaders,
            removeHeaders
        }
    }

    private wantToIntercept(interceptor: MashroomHttpProxyInterceptor, clientRequest: ExpressRequest, targetUri: string): boolean {
        return typeof (interceptor.wantToIntercept) === 'function' && interceptor.wantToIntercept(targetUri, clientRequest);
    }
}