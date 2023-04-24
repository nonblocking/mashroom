
import http from 'http';
import https from 'https';

import type {Agent as HttpAgent,ClientRequest} from 'http';
import type {Agent as HttpsAgent} from 'https';

import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {PoolConfig, PoolMetrics} from '../type-definitions/internal';

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

const addTargetCount = (clientRequest: ClientRequest, hostCount: Record<string, number>, logger: MashroomLogger) => {
    try {
        const target = `${clientRequest.protocol}//${clientRequest.getHeader('host')}`;
        if (hostCount[target]) {
            hostCount[target] ++;
        } else {
            hostCount[target] = 1;
        }
    } catch (e) {
        logger.error('Determining URL for ClientRequest failed', e);
    }
};

const getPoolStats = (agent: HttpAgent | HttpsAgent, logger: MashroomLogger): PoolMetrics => {
    const countArrayEntries = (obj: NodeJS.ReadOnlyDict<any>) => Object.values(obj).reduce((acc, arr) => acc + arr.length, 0);

    const activeConnectionsTargetCount: Record<string, number> = {};
    Object.values(agent.sockets).forEach((activeSockets) => {
        if (activeSockets) {
            activeSockets.forEach((activeSocket) => {
                // @ts-ignore
                const clientRequest = activeSocket._httpMessage as ClientRequest;
                addTargetCount(clientRequest, activeConnectionsTargetCount, logger);
            });
        }
    });

    const waitingRequestsTargetCount: Record<string, number> = {};
    Object.values(agent.requests).forEach((waitingRequests) => {
        if (waitingRequests) {
            waitingRequests.forEach((waitingRequest) => {
                const clientRequest = waitingRequest as unknown as ClientRequest;
                addTargetCount(clientRequest, waitingRequestsTargetCount, logger);
            });
        }
    });

    return {
        activeConnections: countArrayEntries(agent.sockets),
        activeConnectionsTargetCount,
        idleConnections: countArrayEntries(agent.freeSockets),
        waitingRequests: countArrayEntries(agent.requests),
        waitingRequestsTargetCount,
    };
};

export const getHttpPoolMetrics = (logger: MashroomLogger): PoolMetrics | null => {
    if (_httpPool) {
        return getPoolStats(_httpPool, logger);
    }
    return null;
};

export const getHttpsPoolMetrics = (logger: MashroomLogger): PoolMetrics | null => {
    if (_httpsPool) {
        return getPoolStats(_httpsPool, logger);
    }
    return null;
};
