
import http from 'http';
import https from 'https';
import {httpAgentStatsUtils} from '@mashroom/mashroom-utils';

import type {Agent as HttpAgent,ClientRequest} from 'http';
import type {Agent as HttpsAgent} from 'https';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {PoolConfig} from '../type-definitions/internal';

let _config: PoolConfig = {
    keepAlive: true,
    maxTotalSockets: null,
    maxSocketsPerHost: 10,
    rejectUnauthorized: false,
};
let _httpPool: HttpAgent | undefined;
let _httpsPool: HttpsAgent | undefined;

export const setPoolConfig = (config: PoolConfig) => {
    _config = config;
};

export const getPoolConfig = (): PoolConfig => {
    return _config;
};

export const getHttpPool = () => {
    if (!_httpPool) {
        _httpPool = new http.Agent({
            keepAlive: _config.keepAlive,
            maxSockets: _config.maxSocketsPerHost,
            maxTotalSockets: _config.maxTotalSockets ?? undefined,
        });
    }
    return _httpPool;
};

export const getHttpsPool = () => {
    if (!_httpsPool) {
        _httpsPool = new https.Agent({
            keepAlive: _config.keepAlive,
            maxSockets: _config.maxSocketsPerHost,
            maxTotalSockets: _config.maxTotalSockets ?? undefined,
            rejectUnauthorized: _config.rejectUnauthorized,
        });
    }
    return _httpsPool;
};

export const getWaitingRequestsForHostHeader = (protocol: 'http:' | 'https:', host: string) => {
    let waiting = 0;
    const agent = protocol === 'https:' ? getHttpsPool() : getHttpPool();
    Object.values(agent.requests).forEach((waitingRequests) => {
        if (waitingRequests) {
            waitingRequests.forEach((waitingRequest) => {
                const clientRequest = waitingRequest as unknown as ClientRequest;
                if (clientRequest.getHeader('host') === host) {
                    waiting ++;
                }
            });
        }
    });
    return waiting;
};



export const getHttpAgentMetrics = (logger: MashroomLogger) => {
    if (_httpPool) {
        return httpAgentStatsUtils.getAgentStats(_httpPool, logger);
    }
    return null;
};

export const getHttpsAgentMetrics = (logger: MashroomLogger) => {
    if (_httpsPool) {
        return httpAgentStatsUtils.getAgentStats(_httpsPool, logger);
    }
    return null;
};
