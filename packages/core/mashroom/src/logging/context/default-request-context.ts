
import {userAgentUtils, ipUtils} from '@mashroom/mashroom-utils';

import type {IncomingMessage} from 'http';
import type {Request} from 'express';

export default (req: Request | IncomingMessage) => {
    const clientIP = ipUtils.getClientIP(req);

    const ua = userAgentUtils.determineUserAgent(req);

    return {
        clientIP,
        browser: ua.browser.name,
        browserVersion: ua.browser.version,
        os: ua.os.name,
    };
};
