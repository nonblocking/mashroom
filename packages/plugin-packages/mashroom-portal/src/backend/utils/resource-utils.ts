
import http from 'http';
import https from 'https';
import {pipeline} from 'stream/promises';
import {URL} from 'url';
import {resourceUtils, ResourceNotFoundError, ResourceFetchAbortedError, httpAgentStatsUtils} from '@mashroom/mashroom-utils';
import context from '../context/global-portal-context';

import type {Agent as HttpAgent} from 'http';
import type {Agent as HttpsAgent} from 'https';
import type {Response} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';

export type RequestMetrics = {
    httpRequestCountTotal: number;
    httpRequestTargetCount: Record<string, number>;
    httpConnectionErrorCountTotal: number;
    httpConnectionErrorTargetCount: Record<string, number>;
    httpTimeoutCountTotal: number;
    httpTimeoutTargetCount: Record<string, number>;
}

let httpAgent: HttpAgent | undefined;
let httpsAgent: HttpsAgent | undefined;
const requestMetrics: RequestMetrics = {
    httpRequestCountTotal: 0,
    httpRequestTargetCount: {},
    httpConnectionErrorCountTotal: 0,
    httpConnectionErrorTargetCount: {},
    httpTimeoutCountTotal: 0,
    httpTimeoutTargetCount: {},
};

export const isNotFoundError = (error: Error) => {
  return error instanceof ResourceNotFoundError;
};

export const isTimeoutError = (error: Error) => {
    return error instanceof ResourceFetchAbortedError;
};

export const setupResourceFetchHttpAgents = (logger: MashroomLogger) => {
    logger.info('Setting up resource fetch agents with config:', context.portalPluginConfig.resourceFetchConfig);
    const {httpMaxSocketsPerHost, httpRejectUnauthorized} = context.portalPluginConfig.resourceFetchConfig;
    httpAgent = new http.Agent({
        keepAlive: true,
        maxSockets: httpMaxSocketsPerHost,
    });
    httpsAgent = new https.Agent({
        keepAlive: true,
        maxSockets: httpMaxSocketsPerHost,
        rejectUnauthorized: httpRejectUnauthorized,
    });
};

export const streamResource = async (resourceUri: string, res: Response, logger: MashroomLogger): Promise<void> => {
    countRemoteResourceRequest(resourceUri);
    const {fetchTimeoutMs} = context.portalPluginConfig.resourceFetchConfig;
    const abortController = new AbortController();
    const abortTimeout = setTimeout(() => {
        logger.error(`Abort fetching ${resourceUri} because it took longer than ${fetchTimeoutMs}ms`);
        abortController.abort();
    }, fetchTimeoutMs);
    try {
        const {stream, size, contentType, lastModified} = await resourceUtils.getResourceAsStream(resourceUri, {
            abortSignal: abortController.signal,
            httpAgent,
            httpsAgent,
        });
        if (size) {
            res.setHeader('Content-Length', String(size));
        }
        if (lastModified) {
            res.setHeader('Last-Modified', lastModified.toUTCString());
        }
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        } else {
            const fileName = resourceUri.split('/').pop() as string;
            res.type(fileName);
        }
        await pipeline(stream, res);
    } catch (e: any) {
        if (isTimeoutError(e)) {
             countRemoteResourceTimeout(resourceUri);
        } else {
            countRemoteResourceConnectionError(resourceUri);
        }
        throw e;
    } finally {
        clearTimeout(abortTimeout);
    }
};

export const getResourceAsString = async (resourceUri: string, logger: MashroomLogger): Promise<string> => {
    countRemoteResourceRequest(resourceUri);
    const {fetchTimeoutMs} = context.portalPluginConfig.resourceFetchConfig;
    const abortController = new AbortController();
    const abortTimeout = setTimeout(() => {
        logger.error(`Abort fetching ${resourceUri} because it took longer than ${fetchTimeoutMs}ms`);
        abortController.abort();
    }, fetchTimeoutMs);
    try {
        return await resourceUtils.getResourceAsString(resourceUri, {
            abortSignal: abortController.signal,
            httpAgent,
            httpsAgent,
        });
    } catch (e: any) {
        if (isTimeoutError(e)) {
            countRemoteResourceTimeout(resourceUri);
        } else {
            countRemoteResourceConnectionError(resourceUri);
        }
        throw e;
    } finally {
        clearTimeout(abortTimeout);
    }
};

// Metrics

const getProtocolAndHost = (uri: string) => {
    const {protocol, host} = new URL(uri);
    return `${protocol}//${host}`;
};

const countRemoteResourceRequest = (resourceUri: string) => {
    if (resourceUri.startsWith('http')) {
        const target = getProtocolAndHost(resourceUri);
        requestMetrics.httpRequestCountTotal++;
        if (!requestMetrics.httpRequestTargetCount[target]) {
            requestMetrics.httpRequestTargetCount[target] = 0;
        }
        requestMetrics.httpRequestTargetCount[target]++;
    }
};

const countRemoteResourceConnectionError = (resourceUri: string) => {
    if (resourceUri.startsWith('http')) {
        const target = getProtocolAndHost(resourceUri);
        requestMetrics.httpConnectionErrorCountTotal++;
        if (!requestMetrics.httpConnectionErrorTargetCount[target]) {
            requestMetrics.httpConnectionErrorTargetCount[target] = 0;
        }
        requestMetrics.httpConnectionErrorTargetCount[target]++;
    }
};

const countRemoteResourceTimeout = (resourceUri: string) => {
    if (resourceUri.startsWith('http')) {
        const target = getProtocolAndHost(resourceUri);
        requestMetrics.httpTimeoutCountTotal++;
        if (!requestMetrics.httpTimeoutTargetCount[target]) {
            requestMetrics.httpTimeoutTargetCount[target] = 0;
        }
        requestMetrics.httpTimeoutTargetCount[target]++;
    }
};

export const getRequestMetrics = () => requestMetrics;
export const getHttpAgentMetrics = (logger: MashroomLogger) => {
    if (httpAgent) {
        return httpAgentStatsUtils.getAgentStats(httpAgent, logger);
    }
    return null;
};
export const getHttpsAgentMetrics = (logger: MashroomLogger) => {
    if (httpsAgent) {
        return httpAgentStatsUtils.getAgentStats(httpsAgent, logger);
    }
    return null;
};
