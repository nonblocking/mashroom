// @flow

import {userAndAgentContext} from '../src/logging_utils';

describe('logging_utils.userAndAgentContext', () => {

    it('parses the agent string correctly', () => {

        const req: any = {
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            connection: {
                remoteAddress: '127.0.0.1'
            },
            pluginContext: {
                services: {}
            }
        };

        const context = userAndAgentContext(req);

        expect(context).toBeTruthy();
        expect(context).toEqual({
            clientIP: '127.0.0.1',
            browser: 'Chrome',
            browserVersion: '73.0.3683.103',
            os: 'Mac OS',
            username: null,
        });
    });

    it('adds the authenticated user to the context', () => {

        const req: any = {
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:66.0) Gecko/20100101 Firefox/66.0'
            },
            connection: {
                remoteAddress: '192.168.0.1'
            },
            pluginContext: {
                services: {
                    security: {
                       service: {
                           getUser: () => ({
                               username: 'John'
                           })
                       }
                    }
                }
            }
        };

        const context = userAndAgentContext(req);

        expect(context).toBeTruthy();
        expect(context).toEqual({
            clientIP: '192.168.0.1',
            browser: 'Firefox',
            browserVersion: '66.0',
            os: 'Mac OS',
            username: 'John',
        });
    });

});
