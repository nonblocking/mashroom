
import {Readable, Writable} from 'stream';
import nock from 'nock';
// @ts-ignore
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomHttpProxyService from '../src/proxy/MashroomHttpProxyService';

const createDummyRequest = (method: string, data?: string) => {
    const req: any = new Readable();
    req.method = method;
    req.headers = {
        'accept-language': 'de',
        'another-header': 'foo',
    };
    req.pluginContext = {
        loggerFactory,
        services: {

        },
    };

    req.push(data);
    req.push(null);

    return req;
};


const createDummyResponse = () => {
    const res: any = new Writable();
    res.statusCode = null;
    res.statusMessage = null;
    res.body = '';
    res.setHeader = (headerName: string, value: any) => {
        console.info('Header: ', headerName, value);
    };
    res.status = res.sendStatus = function(status: any) {
        this.statusCode = status;
        return {
            send(message: string) {
                res.statusMessage = message;
            }
        };
    };
    res.write = function(chunk: any) {
        this.body += chunk.toString();
        return true;
    };

    return res;
};

const emptyPluginRegistry: any = {
    interceptors: [],
};

describe('MashroomHttpProxyService', () => {

    it('forwards GET request to the target URI',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'foo': 'bar',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, emptyPluginRegistry, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo', {
            'foo': 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('forwards POST request to the target URI',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'foo': 'bar',
            },
        })
            .post('/login')
            .reply(200, 'test post response');

        const httpProxyService = new MashroomHttpProxyService(['GET', 'POST'], [], 2000, emptyPluginRegistry, loggerFactory);

        const req = createDummyRequest('POST', '{ "user": "test }');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/login', {
            'foo': 'bar',
        });

        expect(res.body).toBe('test post response');
    });

    it('forwards query parameters',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo?q=javascript')
            .reply(200, 'test response');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, emptyPluginRegistry, loggerFactory);

        const req = createDummyRequest('GET');
        req.query = {
            q: 'javascript'
        };

        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('sets the correct status code if the target is not available', async () => {
        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, emptyPluginRegistry, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.xxxxxx.at');

        // Expect 503 Service Unavailable
        expect(res.statusCode).toBe(503);
    });

    it('sets the correct status code if the connection times out', async () => {
        nock('https://www.yyyyyyyyyyy.at')
            .get('/')
            .socketDelay(3000)
            .reply(200, 'test response');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, emptyPluginRegistry, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.yyyyyyyyyyy.at');

        // Expect 504 Gateway Timeout
        expect(res.statusCode).toBe(504);
    });

    it('passes the response from the target endpoint',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(201, 'resource created');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, emptyPluginRegistry, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo')

        expect(res.statusCode).toBe(201);
    });

    it('adds headers from interceptors',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
               'Authorization': 'Bearer XXXXXXXX',
                'X-Whatever': '123',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const pluginRegistry: any = {
            interceptors: [
                {
                    pluginName: 'Interceptor 1',
                    interceptor: {
                        intercept() {
                            return {
                                addHeaders: {
                                    'Authorization': 'Bearer XXXXXXXX',
                                }
                            }
                        }
                    }
                },
                {
                    pluginName: 'Interceptor 2',
                    interceptor: {
                        intercept() {
                            return {
                                addHeaders: {
                                    'X-Whatever': '123',
                                }
                            }
                        }
                    }
                }
            ],
        }

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, pluginRegistry, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('allows interceptors to remove headers',  async () => {
        nock('https://www.mashroom-server.com', {
            badheaders: ['another-header']
        })
            .get('/foo')
            .reply(200, 'test response');

        const pluginRegistry: any = {
            interceptors: [
                {
                    pluginName: 'Interceptor 1',
                    interceptor: {
                        intercept() {
                            return {
                                removeHeaders: ['another-header']
                            }
                        }
                    }
                }
            ],
        }

        const httpProxyService = new MashroomHttpProxyService(['GET'], ['another-header'], 2000, pluginRegistry, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('allows interceptors to rewrite the target uri',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(200, 'test response');

        const pluginRegistry: any = {
            interceptors: [
                {
                    pluginName: 'Interceptor 1',
                    interceptor: {
                        intercept() {
                            return {
                                rewrittenTargetUri: 'https://www.mashroom-server.com/foo',
                            }
                        }
                    }
                }
            ],
        }

        const httpProxyService = new MashroomHttpProxyService(['GET'], ['another-header'], 2000, pluginRegistry, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, '_MASHROOM_SERVER_');

        expect(res.body).toBe('test response');
    });

    it('allows interceptors to reject calls',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(200, 'test response');

        const pluginRegistry: any = {
            interceptors: [
                {
                    pluginName: 'Interceptor 1',
                    interceptor: {
                        intercept() {
                            return {
                                reject: true,
                                rejectStatusCode: 403,
                                rejectReason: 'Not allowed',
                            }
                        }
                    }
                }
            ],
        }

        const httpProxyService = new MashroomHttpProxyService(['GET'], ['another-header'], 2000, pluginRegistry, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.statusCode).toBe(403);
        expect(res.statusMessage).toBe('Not allowed');
    });
});

