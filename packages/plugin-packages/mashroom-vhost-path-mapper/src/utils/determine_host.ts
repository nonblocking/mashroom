
import type {Request} from 'express';
import type {DeterminedHost} from '../../type-definitions/internal';

export default (req: Request, considerHttpHeaders: Array<string>): DeterminedHost => {
    const hostHeader = req.headers.host as string;
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

    if (hostHeader) {
        const [hostFromHeader, portFromHeader] = hostHeader.split(':');
        if (!hostname) {
            hostname = hostFromHeader;
        }
        if (portFromHeader && hostFromHeader === hostname) {
            port = portFromHeader;
        }
    }

    hostname = hostname.trim();

    return {
        hostname,
        port,
    };
};
