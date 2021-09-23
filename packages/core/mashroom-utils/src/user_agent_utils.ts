
import UAParser from 'ua-parser-js';
import type {IncomingMessage} from 'http';

export type UserAgent = {
    readonly browser: {
        readonly name: 'Android Browser' | 'Chrome' | 'Chromium' | 'Edge' | 'Firefox' | 'IE' | 'IEMobile' | 'Konqueror' | 'Mobile Safari' | 'Opera Mini' | 'Opera' | 'Safari' | 'Samsung Browser' | 'Tizen Browser' | string | undefined;
        readonly version: string | undefined;
    };
    readonly os: {
        name: string;
    };
}

export const determineUserAgent = (req: IncomingMessage): UserAgent => {
    const ua = UAParser(req.headers['user-agent']);

    return {
        browser: {
            name: ua.browser.name,
            version: ua.browser.version
        },
        os: {
            name: ua.os.name || 'Unknown'
        }
    };
};
