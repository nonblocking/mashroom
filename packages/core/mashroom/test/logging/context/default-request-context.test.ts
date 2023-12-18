
import defaultRequestContext from '../../../src/logging/context/default-request-context';

describe('default_request_context', () => {

    it('determines the client ip and parses the agent string correctly', () => {

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

        const context = defaultRequestContext(req);

        expect(context).toBeTruthy();
        expect(context).toEqual({
            clientIP: '127.0.0.1',
            browser: 'Chrome',
            browserVersion: '73.0.3683.103',
            os: 'Mac OS',
        });
    });

});
