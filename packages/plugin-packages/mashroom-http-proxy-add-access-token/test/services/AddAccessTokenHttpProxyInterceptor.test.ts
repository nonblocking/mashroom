
import AddAccessTokenHttpProxyInterceptor from '../../src/AddAccessTokenHttpProxyInterceptor';

describe('AddAccessTokenHttpProxyInterceptor', () => {

    it('adds headers if the uri matches', async () => {
        const interceptor = new AddAccessTokenHttpProxyInterceptor(false, 'X-USER-ACCESS-TOKEN', ['foo', 'ba.r']);

        const req: any = {
            pluginContext: {
                loggerFactory: () => console,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                secrets: {
                                    accessToken: 'XXXXXXXXXXXX'
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
                'X-USER-ACCESS-TOKEN': 'XXXXXXXXXXXX'
            }
        });
    });

    it('adds a bearer token if addBeaerer is true', async () => {
        const interceptor = new AddAccessTokenHttpProxyInterceptor(true, 'X-USER-ACCESS-TOKEN', ['foo', 'ba.r']);

        const req: any = {
            pluginContext: {
                loggerFactory: () => console,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                secrets: {
                                    accessToken: 'XXXXXXXXXXXX'
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
                Authorization: 'Bearer XXXXXXXXXXXX',
            }
        });
    });

    it('does not add headers if the uri doesn\' match', async () => {
        const interceptor = new AddAccessTokenHttpProxyInterceptor(false, 'X-USER-ACCESS-TOKEN', ['foo', 'ba.r']);

        const req: any = {
            pluginContext: {
                loggerFactory: () => console,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                secrets: {
                                    accessToken: 'XXXXXXXXXXXX'
                                }
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

