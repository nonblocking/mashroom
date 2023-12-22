
import http from 'http';
import https from 'https';
import {pipeline} from 'stream/promises';
import {resourceUtils} from '@mashroom/mashroom-utils';
import context from '../context/global-portal-context';

import type {Agent as HttpAgent} from 'http';
import type {Agent as HttpsAgent} from 'https';
import type {Response} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';

let httpAgent: HttpAgent | undefined;
let httpsAgent: HttpsAgent | undefined;

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

    } finally {
        clearTimeout(abortTimeout);
    }
};

export const getResourceAsString = async (resourceUri: string, logger: MashroomLogger): Promise<string> => {
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
    } finally {
        clearTimeout(abortTimeout);
    }
};
