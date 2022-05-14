
import {determineUserAgent} from '@mashroom/mashroom-utils/lib/user_agent_utils';
import {getClientIP} from '@mashroom/mashroom-utils/lib/ip_utils';

import type {IncomingMessage} from 'http';
import type {Request} from 'express';

export default (req: Request | IncomingMessage) => {
    const clientIP = getClientIP(req);

    const ua = determineUserAgent(req);

    return {
        clientIP,
        browser: ua.browser.name,
        browserVersion: ua.browser.version,
        os: ua.os.name,
    };
};
