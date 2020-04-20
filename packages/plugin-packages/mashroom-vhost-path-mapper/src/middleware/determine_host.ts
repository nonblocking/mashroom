
import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {DeterminedHost} from '../../type-definitions/internal';

export default (req: ExpressRequest): DeterminedHost => {
    const hostHeader = req.headers.host;
    const hostname = req.hostname;
    let port = undefined;

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
