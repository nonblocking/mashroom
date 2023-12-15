import type {IncomingMessageWithContext,MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {Request, Response} from 'express';
import type {IncomingMessage} from 'http';
import type {HttpHeaders, QueryParams} from '../../type-definitions';
import type {InterceptorHandler} from '../../type-definitions/internal';

type ProcessRequestInterceptorsResult = {
    responseHandled: true;
    effectiveTargetUri?: void;
    effectiveAdditionalHeaders?: void;
    effectiveQueryParams?: void;
} | {
    responseHandled: false;
    effectiveTargetUri: string;
    effectiveAdditionalHeaders: HttpHeaders;
    effectiveQueryParams: QueryParams;
};

export const processRequest = async (req: Request, res: Response, targetUri: string, additionalHeaders: HttpHeaders, interceptorHandler: InterceptorHandler, logger: MashroomLogger): Promise<ProcessRequestInterceptorsResult> => {
    let effectiveTargetUri = encodeURI(targetUri);
    let effectiveAdditionalHeaders = {
        ...additionalHeaders,
    };
    let effectiveQueryParams = {
        ...req.query
    } as QueryParams;

    const interceptorResult = await interceptorHandler.processHttpRequest(req, res, targetUri, additionalHeaders, logger);
    if (interceptorResult.responseHandled) {
        return {
            responseHandled: true,
        };
    }
    if (interceptorResult.rewrittenTargetUri) {
        effectiveTargetUri = encodeURI(interceptorResult.rewrittenTargetUri);
    }
    if (interceptorResult.addHeaders) {
        effectiveAdditionalHeaders = {
            ...effectiveAdditionalHeaders,
            ...interceptorResult.addHeaders,
        };
    }
    if (interceptorResult.removeHeaders) {
        interceptorResult.removeHeaders.forEach((headerKey) => {
            delete effectiveAdditionalHeaders[headerKey];
            delete req.headers[headerKey];
        });
    }
    if (interceptorResult.addQueryParams) {
        effectiveQueryParams = {
            ...effectiveQueryParams,
            ...interceptorResult.addQueryParams,
        };
    }
    if (interceptorResult.removeQueryParams) {
        interceptorResult.removeQueryParams.forEach((paramKey) => {
            delete effectiveQueryParams[paramKey];
        });
    }

    return {
        responseHandled: false,
        effectiveTargetUri,
        effectiveAdditionalHeaders,
        effectiveQueryParams,
    };
};

export const processHttpResponse = async (clientRequest: Request, clientResponse: Response, targetUri: string, targetResponse: IncomingMessage, interceptorHandler: InterceptorHandler, logger: MashroomLogger)=> {
    const interceptorResult = await interceptorHandler.processHttpResponse(clientRequest, clientResponse,targetUri, targetResponse, logger);

    if (interceptorResult.responseHandled) {
        return {
            responseHandled: true,
        };
    }

    if (interceptorResult.addHeaders) {
        Object.keys(interceptorResult.addHeaders).forEach((headerKey) => {
            targetResponse.headers[headerKey] = interceptorResult.addHeaders?.[headerKey];
        });
    }
    if (interceptorResult.removeHeaders) {
        interceptorResult.removeHeaders.forEach((headerKey) => {
            delete targetResponse.headers[headerKey];
        });
    }

    return {
        responseHandled: false,
    };
};

export const processWsRequest = async(clientRequest: IncomingMessageWithContext, targetUri: string, additionalHeaders: HttpHeaders, interceptorHandler: InterceptorHandler, logger: MashroomLogger) => {
    let effectiveTargetUri = encodeURI(targetUri);
    let effectiveAdditionalHeaders = {
        ...additionalHeaders,
    };

    const interceptorResult = await interceptorHandler.processWsRequest(clientRequest, targetUri, additionalHeaders, logger);
    if (interceptorResult.rewrittenTargetUri) {
        effectiveTargetUri = encodeURI(interceptorResult.rewrittenTargetUri);
    }
    if (interceptorResult.addHeaders) {
        effectiveAdditionalHeaders = {
            ...effectiveAdditionalHeaders,
            ...interceptorResult.addHeaders,
        };
    }
    if (interceptorResult.removeHeaders) {
        interceptorResult.removeHeaders.forEach((headerKey) => {
            delete effectiveAdditionalHeaders[headerKey];
            delete clientRequest.headers[headerKey];
        });
    }

    return {
        effectiveTargetUri,
        effectiveAdditionalHeaders,
    };
};
