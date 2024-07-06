import type {Transform} from 'stream';
import type {IncomingMessageWithContext,MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {Request, Response} from 'express';
import type {IncomingMessage} from 'http';
import type {HttpHeaders, QueryParams} from '../../type-definitions';
import type {InterceptorHandler} from '../../type-definitions/internal';

type ProcessHttpRequestInterceptorsResult = {
    readonly responseHandled: true;
    readonly effectiveTargetUri?: never;
    readonly effectiveAdditionalHeaders?: never;
    readonly effectiveQueryParams?: never;
    readonly streamTransformers?: never;
} | {
    readonly responseHandled: false;
    readonly effectiveTargetUri: string;
    readonly effectiveAdditionalHeaders: HttpHeaders;
    readonly effectiveQueryParams: QueryParams;
    readonly streamTransformers: Array<Transform>;
};

type ProcessHttpResponseInterceptorsResult = {
    readonly responseHandled: true;
    readonly streamTransformers?: never;
} | {
    readonly responseHandled: false;
    readonly streamTransformers: Array<Transform>;
};

type ProcessWsRequestInterceptorsResult = {
    readonly effectiveTargetUri: string;
    readonly effectiveAdditionalHeaders: HttpHeaders;
}

const HEADER_X_FORWARDED_FOR = 'x-forwarded-for';
const HEADER_X_FORWARDED_PROTO = 'x-forwarded-proto';
const HEADER_X_FORWARDED_HOST = 'x-forwarded-host';

export const processHttpRequestInterceptors = async (req: Request, res: Response, targetUri: string, additionalHeaders: HttpHeaders, interceptorHandler: InterceptorHandler, logger: MashroomLogger): Promise<ProcessHttpRequestInterceptorsResult> => {
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
        streamTransformers: interceptorResult.streamTransformers ?? [],
    };
};

export const processHttpResponseInterceptors = async (clientRequest: Request, clientResponse: Response, targetUri: string, targetResponse: IncomingMessage, interceptorHandler: InterceptorHandler, logger: MashroomLogger): Promise<ProcessHttpResponseInterceptorsResult> => {
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
        streamTransformers: interceptorResult.streamTransformers ?? [],
    };
};

export const processWsRequestInterceptors = async (clientRequest: IncomingMessageWithContext, targetUri: string, additionalHeaders: HttpHeaders, interceptorHandler: InterceptorHandler, logger: MashroomLogger): Promise<ProcessWsRequestInterceptorsResult> => {
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

/*
 * We keep the incoming x-forwarded-* headers and just add what is necessary
 * (and add Mashroom host as extra forwarded for element)
 */
export const createForwardedForHeaders = (clientRequest: IncomingMessage, isWebsocket = false): Record<string, string> => {
    let forwardedForHeader = clientRequest.headers[HEADER_X_FORWARDED_FOR] as string | undefined;
    let forwardedProtoHeader = clientRequest.headers[HEADER_X_FORWARDED_PROTO] as string | undefined;
    let forwardedHostHeader = clientRequest.headers[HEADER_X_FORWARDED_HOST] as string | undefined;

    const remoteAddress = clientRequest.socket.remoteAddress;
    if (!forwardedForHeader) {
        forwardedForHeader = remoteAddress;
    } else {
        forwardedForHeader = `${forwardedForHeader }, ${remoteAddress}`;
    }
    if (!forwardedProtoHeader) {
        const encrypted = 'encrypted' in clientRequest.socket;
        forwardedProtoHeader = isWebsocket ?
            (encrypted ? 'wss' : 'ws') :
            (encrypted ? 'https' : 'http');
    }
    if (!forwardedHostHeader) {
        const host = clientRequest.headers.host;
        if (host) {
            forwardedHostHeader = host.split(':')[0];
        }
    }

    const headers: Record<string, string> = {};
    if (forwardedForHeader) {
        headers[HEADER_X_FORWARDED_FOR] = forwardedForHeader;
    }
    if (forwardedProtoHeader) {
        headers[HEADER_X_FORWARDED_PROTO] = forwardedProtoHeader;
    }
    if (forwardedHostHeader) {
        headers[HEADER_X_FORWARDED_HOST] = forwardedHostHeader;
    }

    return headers;
};
