import type {Agent as HttpAgent, ClientRequest} from 'http';
import type {Agent as HttpsAgent} from 'https';

type Logger = {
    error(message: string, ...args: any[]): void;
}

export type HttpAgentMetrics = {
    readonly activeConnections: number;
    readonly activeConnectionsTargetCount: Record<string, number>;
    readonly idleConnections: number;
    readonly waitingRequests: number;
    readonly waitingRequestsTargetCount: Record<string, number>;
}

const addTargetCount = (clientRequest: ClientRequest, hostCount: Record<string, number>, logger: Logger) => {
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

export const getAgentStats = (agent: HttpAgent | HttpsAgent, logger: Logger): HttpAgentMetrics => {
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
