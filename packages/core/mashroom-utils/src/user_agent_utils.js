// @flow

import uaParser from 'ua-parser-js';

import type {$Request as Request} from 'express';

export type UserAgent = {
    +browser: {
        +name: ? 'Android Browser' | 'Chrome' | 'Chromium' | 'Edge' | 'Firefox' | 'IE' | 'IEMobile' | 'Konqueror' | 'Mobile Safari' | 'Opera Mini' | 'Opera' | 'Safari' | 'Samsung Browser' | 'Tizen Browser' | string,
        +version: ?string
    },
    +os: {
        name: ?string
    }
}

export const determineUserAgent = (req: Request): UserAgent => {
    const ua = uaParser(req.headers['user-agent']);

    return {
        browser: {
            name: ua.browser.name,
            version: ua.browser.version
        },
        os: {
            name: ua.os.name
        }
    };
};
