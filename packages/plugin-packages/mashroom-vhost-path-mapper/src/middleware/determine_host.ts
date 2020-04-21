
import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {DeterminedHost} from '../../type-definitions/internal';

export default (considerHttpHeaders: Array<string>, req: ExpressRequest): DeterminedHost => {
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
                    hostname = forwardingHeader;
                }
                break;
            }
        }
    }

    if (!hostname) {
        hostname = req.hostname;
    }

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
