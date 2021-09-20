
import AddIdTokenHttpProxyInterceptor from '../../src/AddIdTokenHttpProxyInterceptor';

describe('AddIdTokenHttpProxyInterceptor', () => {

    it('adds headers if the uri matches', async () => {
        const interceptor = new AddIdTokenHttpProxyInterceptor(false, 'X-USER-ID-TOKEN', ['foo', 'ba.r']);

        const req: any = {
            pluginContext: {
                loggerFactory: () => console,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                secrets: {
                                    idToken: 'XXXXXXXXXXXX'
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
                'X-USER-ID-TOKEN': 'XXXXXXXXXXXX'
            }
        });
    });

    it('adds a bearer token if addBeaerer is true', async () => {
        const interceptor = new AddIdTokenHttpProxyInterceptor(true, 'X-USER-ID-TOKEN', ['foo', 'ba.r']);

        const req: any = {
            pluginContext: {
                loggerFactory: () => console,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                secrets: {
                                    idToken: 'XXXXXXXXXXXX'
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
        const interceptor = new AddIdTokenHttpProxyInterceptor(false, 'X-USER-ID-TOKEN', ['foo', 'ba.r']);

        const req: any = {
            pluginContext: {
                loggerFactory: () => console,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                secrets: {
                                    idToken: 'XXXXXXXXXXXX'
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

