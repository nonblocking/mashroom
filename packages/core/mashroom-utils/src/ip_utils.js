// @flow

import requestIp from 'request-ip';
import ipFilter from 'ip-filter';

import type {$Request} from 'express';

export const getClientIP = (request: $Request): string => {
    return requestIp.getClientIp(request);
};

export const clientIPMatch = (request: $Request, patterns: string | Array<string>): boolean => {
    return !!ipFilter(getClientIP(request), patterns);
};
