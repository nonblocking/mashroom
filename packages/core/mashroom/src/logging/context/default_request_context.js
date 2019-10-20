// @flow

import type {$Request} from 'express';
import {determineUserAgent} from '@mashroom/mashroom-utils/lib/user_agent_utils';

export default (req: $Request) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    const ua = determineUserAgent(req);

    return {
        clientIP,
        browser: ua.browser.name,
        browserVersion: ua.browser.version,
        os: ua.os.name,
    };
}
