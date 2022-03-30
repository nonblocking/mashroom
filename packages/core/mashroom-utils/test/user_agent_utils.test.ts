
import {determineUserAgent} from '../src/user_agent_utils';

describe('user_agent_utils.determineUserAgent', () => {

    it('determines browser version and os', () => {
        const req1: any = {
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
            }
        }
        expect(determineUserAgent(req1)).toEqual({
            browser: {
                name: 'Chrome',
                version: '94.0.4606.81',
                major: '94',
            },
            os: {
                name: 'Mac OS',
                version: '10.15.7',
            }
        });

        const req2: any = {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36 Edg/95.0.1020.30',
            }
        }
        expect(determineUserAgent(req2)).toEqual({
            browser: {
                name: 'Edge',
                version: '95.0.1020.30',
                major: '95',
            },
            os: {
                name: 'Windows',
                version: '10',
            }
        });

        const req3: any = {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4758.102 Safari/537.36',
            }
        }
        expect(determineUserAgent(req3)).toEqual({
            browser: {
                name: 'Chrome',
                version: '100.0.4758.102',
                major: '100',
            },
            os: {
                name: 'Windows',
                version: '10',
            }
        });
    });
});
