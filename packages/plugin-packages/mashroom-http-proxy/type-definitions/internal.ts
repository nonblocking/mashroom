
import type {IncomingHttpHeaders} from 'http';

export interface HttpHeaderFilter {
    filter(headers: IncomingHttpHeaders): void;
}

export type PoolConfig = {
    rejectUnauthorized: boolean;
    maxSockets: number;
}

export type PoolStats = {
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
}
