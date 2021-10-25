
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
                version: '94.0.4606.81'
            },
            os: {
                name: 'Mac OS'
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
                version: '95.0.1020.30'
            },
            os: {
                name: 'Windows'
            }
        });
    });
});
