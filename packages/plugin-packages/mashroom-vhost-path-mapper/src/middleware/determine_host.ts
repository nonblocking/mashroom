
import type {Request} from 'express';
import type {DeterminedHost} from '../../type-definitions/internal';

export default (considerHttpHeaders: Array<string>, req: Request): DeterminedHost => {
    const hostHeader = req.headers.host;
    let hostname = undefined;
    let port = undefined;

    if (Array.isArray(considerHttpHeaders)) {
        for (let i = 0; i < considerHttpHeaders.length; i++) {
            const forwardingHeader = req.headers[considerHttpHeaders[i]];
            if (forwardingHeader) {
                if (Array.isArray(forwardingHeader)) {
                    hostname = forwardingHeader[0];
                } else {
                    hostname = forwardingHeader.split(',')[0];
                }
                break;
            }
        }
    }

    if (!hostname) {
        hostname = req.hostname;
    }

    hostname = hostname.trim();

    if (hostHeader && hostHeader.indexOf(':') !== -1) {
        const [hostFromHeader, portFromHeader] = hostHeader.split(':');
        if (hostFromHeader === hostname) {
            port = portFromHeader;
        }
    }

    return {
        hostname,
        port,
    };
};
