
import requestIp from 'request-ip';
// @ts-ignore
import ipFilter from 'ip-filter';

import type {IncomingMessage} from 'http';
import type {Request} from 'express';

export const getClientIP = (request: Request | IncomingMessage): string => {
    // @ts-ignore
    return requestIp.getClientIp(request);
};

export const clientIPMatch = (request: Request | IncomingMessage, patterns: string | Array<string>): boolean => {
    return !!ipFilter(getClientIP(request), patterns);
};
