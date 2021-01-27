
import {Readable, Writable} from 'stream';
import nock from 'nock';
// @ts-ignore
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import ProxyImplRequest from '../src/proxy/ProxyImplRequest';
import InterceptorHandler from '../src/proxy/InterceptorHandler';
import HttpHeaderFilter from '../src/proxy/HttpHeaderFilter';
import {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';
import {HttpHeaders, QueryParams} from '../type-definitions';

const createDummyRequest = (method: string, data?: string) => {
    const req: any = new Readable();
    req.method = method;
    req.headers = {
        'accept-language': 'de',
        'another-header': 'foo',
    };
    req.query = {

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

const noopInterceptorHandler = new InterceptorHandler(emptyPluginRegistry);
const removeAllHeaderFilter = new HttpHeaderFilter([]);

describe('ProxyImplRequest', () => {

    it('forwards GET request to the target URI',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'foo': 'bar',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxyService = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

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

        const httpProxyService = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

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

        const httpProxyService = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

        const req = createDummyRequest('GET');
        req.query = {
            q: 'javascript'
        };

        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('sets the correct status code if the target is not available', async () => {
        const httpProxyService = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.xxxxxxxxxxxxxxxxxxs.at');

        // Expect 503 Service Unavailable
        expect(res.statusCode).toBe(503);
    });

    it('sets the correct status code if the connection times out', async () => {
        nock('https://www.yyyyyyyyyyy.at')
            .get('/')
            .delay(3000)
            .reply(200, 'test response');

        const httpProxyService = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

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

        const httpProxyService = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

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
                        interceptRequest() {
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
                        interceptRequest() {
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
        const interceptorHandler = new InterceptorHandler(pluginRegistry);

        const httpProxyService = new ProxyImplRequest(2000, interceptorHandler, removeAllHeaderFilter, loggerFactory);

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
                        interceptRequest() {
                            return {
                                removeHeaders: ['another-header']
                            }
                        }
                    }
                }
            ],
        }
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['another-header'])

        const httpProxyService = new ProxyImplRequest(2000, interceptorHandler, headerFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('adds query params from interceptors',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .query({
                foo: 'bar'
            })
            .reply(200, 'test response');

        const pluginRegistry: any = {
            interceptors: [
                {
                    pluginName: 'Interceptor 1',
                    interceptor: {
                        interceptRequest() {
                            return {
                                addQueryParams: {
                                    'foo': 'bar',
                                }
                            }
                        }
                    }
                }
            ],
        }
        const interceptorHandler = new InterceptorHandler(pluginRegistry);

        const httpProxyService = new ProxyImplRequest(2000, interceptorHandler, removeAllHeaderFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('allows interceptors to remove query params',  async () => {
        nock('https://www.mashroom-server.at')
            .get('/foo')
            .query({
            })
            .reply(200, 'test response');

        const pluginRegistry: any = {
            interceptors: [
                {
                    pluginName: 'Interceptor 1',
                    interceptor: {
                        interceptRequest() {
                            return {
                                removeQueryParams: ['foo']
                            }
                        }
                    }
                }
            ],
        }
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['another-header'])

        const httpProxyService = new ProxyImplRequest(2000, interceptorHandler, headerFilter, loggerFactory);

        const req = createDummyRequest('GET');
        req.query.foo = 'bar';
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.at/foo');

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
                        interceptRequest() {
                            return {
                                rewrittenTargetUri: 'https://www.mashroom-server.com/foo',
                            }
                        }
                    }
                }
            ],
        }
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['another-header'])

        const httpProxyService = new ProxyImplRequest(2000, interceptorHandler, headerFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, '__MASHROOM_SERVER__');

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
                        interceptRequest(targetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>,
                                         clientRequest: ExpressRequest, clientResponse: ExpressResponse) {
                            clientResponse.sendStatus(403);

                            return {
                               responseHandled: true,
                            }
                        }
                    }
                }
            ],
        }
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['another-header'])

        const httpProxyService = new ProxyImplRequest(2000, interceptorHandler, headerFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.statusCode).toBe(403);
    });
});
