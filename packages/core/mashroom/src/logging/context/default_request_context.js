// @flow

import type {$Request} from 'express';
import {determineUserAgent} from '@mashroom/mashroom-utils/lib/user_agent_utils';
import {getClientIP} from '@mashroom/mashroom-utils/lib/ip_utils';

export default (req: $Request | http$IncomingMessage<>) => {
    const clientIP = getClientIP(req);

    const ua = determineUserAgent(req);

    return {
        clientIP,
        browser: ua.browser.name,
        browserVersion: ua.browser.version,
        os: ua.os.name,
    };
}
