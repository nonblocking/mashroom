
import http from 'http';
import https from 'https';

import type {Agent as HttpAgent} from 'http';
import type {Agent as HttpsAgent} from 'https';

import type {PoolConfig, PoolStats} from '../type-definitions/internal';

let _config: PoolConfig = {
    maxSockets: 10,
    rejectUnauthorized: false,
};
let _httpPool: HttpAgent | undefined;
let _httpsPool: HttpsAgent | undefined;

export const setPoolConfig = (config: PoolConfig) => {
    _config = config;
}

export const getPoolConfig = (): PoolConfig => {
    return _config;
}

export const getHttpPool = () => {
    if (!_httpPool) {
        _httpPool = new http.Agent({
            keepAlive: true,
            maxSockets: _config.maxSockets,
        });
    }
    return _httpPool;
};

export const getHttpsPool = () => {
    if (!_httpsPool) {
        _httpsPool = new https.Agent({
            keepAlive: true,
            maxSockets: _config.maxSockets,
            rejectUnauthorized: _config.rejectUnauthorized,
        });
    }
    return _httpsPool;
};

const getPoolStats = (agent: HttpAgent | HttpsAgent): PoolStats => {
    const countArrayEntries = (obj: NodeJS.ReadOnlyDict<any>) => Object.values(obj).reduce((acc, arr) => acc + arr.length, 0);

    return {
        activeConnections: countArrayEntries(agent.sockets),
        // @ts-ignore Not sure why freeSockets is not part of the type definition; see: https://nodejs.org/api/http.html#http_agent_freesockets
        idleConnections: countArrayEntries(agent.freeSockets),
        waitingRequests: countArrayEntries(agent.requests),
    }
};

export const getHttpPoolStats = (): PoolStats | null => {
    if (_httpPool) {
        return getPoolStats(_httpPool);
    }
    return null;
};

export const getHttpsPoolStats = (): PoolStats | null => {
    if (_httpsPool) {
        return getPoolStats(_httpsPool);
    }
    return null;
};
