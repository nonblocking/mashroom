
import requestIp from 'request-ip';
import ipFilter from 'ip-filter';

import type {IncomingMessage} from 'http';
import type {Request} from 'express';

export const getClientIP = (request: Request | IncomingMessage): string | null => {
    return requestIp.getClientIp(request);
};

export const clientIPMatch = (request: Request | IncomingMessage, patterns: string | Array<string>): boolean => {
    const clientIp = getClientIP(request);
    return !!clientIp && !!ipFilter(clientIp, patterns);
};
