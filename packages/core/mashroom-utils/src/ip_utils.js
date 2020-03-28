// @flow

import requestIp from 'request-ip';
import ipFilter from 'ip-filter';

import type {$Request} from 'express';

export const getClientIP = (request: $Request | http$IncomingMessage<>): string => {
    return requestIp.getClientIp(request);
};

export const clientIPMatch = (request: $Request | http$IncomingMessage<>, patterns: string | Array<string>): boolean => {
    return !!ipFilter(getClientIP(request), patterns);
};
