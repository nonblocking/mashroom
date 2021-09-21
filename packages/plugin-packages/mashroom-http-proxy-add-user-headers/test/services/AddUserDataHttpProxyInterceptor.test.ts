
import AddUserDataHttpProxyInterceptor from '../../src/AddUserHeadersHttpProxyInterceptor';

describe('AddUserDataHttpProxyInterceptor', () => {

    it('adds headers if the uri matches', async () => {
        const extraDataMapping = {
            'X-USER-TEST': 'test',
        };
        const interceptor = new AddUserDataHttpProxyInterceptor('X-USER-NAME', 'X-USER-DISPLAY-NAME', 'X-USER-EMAIL', extraDataMapping, ['foo', 'ba.r']);

        const req: any = {
            pluginContext: {
                loggerFactory: () => console,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                username: 'john',
                                displayName: 'John',
                                email: 'john@test.com',
                                extraData: {
                                    test: 1,
                                }
                            }),
                        }
                    }
                }
            }
        };
        const res: any = {
        };
        const result = await interceptor.interceptRequest('http://baar.com', {}, {}, req, res);

        expect(result).toEqual({
            addHeaders: {
                'X-USER-DISPLAY-NAME': 'John',
                'X-USER-EMAIL': 'john@test.com',
                'X-USER-NAME': 'john',
                'X-USER-TEST': 1,
            }
        });
    });

    it('does not add headers if the uri doesn\' match', async () => {
        const interceptor = new AddUserDataHttpProxyInterceptor('X-USER-NAME', 'X-USER-DISPLAY-NAME', 'X-USER-EMAIL', {}, ['foo', 'ba.r']);

        const req: any = {
            pluginContext: {
                loggerFactory: () => console,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                username: 'john',
                                displayName: 'John',
                                email: 'john@test.com'
                            }),
                        }
                    }
                }
            }
        };
        const res: any = {
        };
        const result = await interceptor.interceptRequest('http://bar.com', {}, {}, req, res);

        expect(result).toBeFalsy();
    });

});

