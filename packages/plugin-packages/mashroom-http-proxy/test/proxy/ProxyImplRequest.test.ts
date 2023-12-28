
import {Readable, Writable} from 'stream';
import nock from 'nock';
import {loggingUtils} from '@mashroom/mashroom-utils';
import ProxyImplRequest from '../../src/proxy/ProxyImplRequest';
import InterceptorHandler from '../../src/proxy/InterceptorHandler';
import HttpHeaderFilter from '../../src/proxy/HttpHeaderFilter';

import type {Request, Response} from 'express';
import type {HttpHeaders, QueryParams} from '../../type-definitions';
import type {MashroomHttpProxyInterceptorHolder} from '../../type-definitions/internal';

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
        loggerFactory: loggingUtils.dummyLoggerFactory,
        services: {
        },
    };
    req.connection = {
    };
    req.socket = {
        remoteAddress: '1.2.3.4',
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
    res.headers = {};
    res.setHeader = (headerName: string, value: any) => {
        console.info('Header: ', headerName, value);
        res.headers[headerName] = value;
    };
    res.status = res.sendStatus = (status: number) => {
        res.statusCode = status;
        return {
            send(message: string) {
                res.statusMessage = message;
            }
        };
    };
    res.write = (chunk: any) => {
        res.body += chunk.toString();
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

    beforeEach(() => {
        nock.cleanAll();
    });

    it('forwards GET request to the target URI',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'foo': 'bar',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo', {
            'foo': 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('sets the correct forwarded-for headers',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'foo': 'bar',
                'x-forwarded-proto': 'http',
                'x-forwarded-for': '1.2.3.4',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, false, null, true, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo', {
            'foo': 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('takes existing forwarded-for headers into consideration',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'foo': 'bar',
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'test.com',
                'x-forwarded-for': '10.0.0.3, 1.2.3.4',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, false, null, true, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        req.headers['x-forwarded-for'] = '10.0.0.3';
        req.headers['x-forwarded-host'] = 'test.com';
        req.headers['x-forwarded-proto'] = 'https';
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo', {
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
            .post('/login', (body) => {
                return body.user === 'test';
            })
            .reply(200, 'test post response');

        const httpProxy = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('POST', '{ "user": "test" }');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/login', {
            'foo': 'bar',
        });

        expect(res.body).toBe('test post response');
    });

    it('forwards query parameters',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo?q=javascript%205')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        req.query = {
            q: 'javascript 5'
        };

        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('forwards query parameters correctly if the base path already contain some',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo?bar=2&q=javascript%205')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        req.query = {
            q: 'javascript 5'
        };

        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo?bar=2');

        expect(res.body).toBe('test response');
    });

    it('sets the correct status code if the target is not available', async () => {
        const httpProxy = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://localhost:22334/foo');

        // Expect 502 Bad Gateway
        expect(res.statusCode).toBe(502);
    });

    it('sets the correct status code if the connection times out', async () => {
        nock('https://www.yyyyyyyyyyy.at')
            .get('/')
            .delay(3000)
            .reply(200, 'test response');

        const httpProxy = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.yyyyyyyyyyy.at');

        // Expect 504 Gateway Timeout
        expect(res.statusCode).toBe(504);

        // Wait until the nock responses, otherwise we would have an open handle
        await new Promise((resolve) => setTimeout(resolve, 3000));
    });

    it('passes the response from the target endpoint',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(201, 'resource created');

        const httpProxy = new ProxyImplRequest(2000, noopInterceptorHandler, removeAllHeaderFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.statusCode).toBe(201);
    });

    it('adds headers from request interceptors',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'authorization': 'Bearer XXXXXXXX',
                'x-whatever': '123',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const interceptors: Array<MashroomHttpProxyInterceptorHolder> = [
            {
                order: 1000,
                pluginName: 'Interceptor 1',
                interceptor: {
                    async interceptRequest() {
                        return {
                            addHeaders: {
                                'authorization': 'Bearer XXXXXXXX',
                            }
                        };
                    },
                    async interceptResponse() {
                        return null;
                    }
                }
            },
            {
                order: 1000,
                pluginName: 'Interceptor 2',
                interceptor: {
                    async interceptRequest() {
                        return {
                            addHeaders: {
                                'x-whatever': '123',
                            }
                        };
                    },
                    async interceptResponse() {
                        return null;
                    }
                }
            }
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);

        const httpProxy = new ProxyImplRequest(2000, interceptorHandler, removeAllHeaderFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('allows request interceptors to remove headers',  async () => {
        nock('https://www.mashroom-server.com', {
            badheaders: ['another-header']
        })
            .get('/foo')
            .reply(200, 'test response');

        const interceptors: Array<MashroomHttpProxyInterceptorHolder> = [
            {
                order: 1000,
                pluginName: 'Interceptor 1',
                interceptor: {
                    async interceptRequest() {
                        return {
                            removeHeaders: ['another-header']
                        };
                    },
                    async interceptResponse() {
                        return null;
                    }
                }
            }
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['another-header']);

        const httpProxy = new ProxyImplRequest(2000, interceptorHandler, headerFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('adds query params from request interceptors',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .query({
                foo: 'bar'
            })
            .reply(200, 'test response');

        const interceptors: Array<MashroomHttpProxyInterceptorHolder> = [
            {
                order: 1000,
                pluginName: 'Interceptor 1',
                interceptor: {
                    async interceptRequest() {
                        return {
                            addQueryParams: {
                                'foo': 'bar',
                            }
                        };
                    },
                    async interceptResponse() {
                        return null;
                    }
                }
            }
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);

        const httpProxy = new ProxyImplRequest(2000, interceptorHandler, removeAllHeaderFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('allows request interceptors to remove query params',  async () => {
        nock('https://www.mashroom-server.at')
            .get('/foo')
            .query({
            })
            .reply(200, 'test response');

        const interceptors: Array<MashroomHttpProxyInterceptorHolder> = [
            {
                order: 1000,
                pluginName: 'Interceptor 1',
                interceptor: {
                    async interceptRequest() {
                        return {
                            removeQueryParams: ['foo']
                        };
                    },
                    async interceptResponse() {
                        return null;
                    }
                }
            }
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['another-header']);

        const httpProxy = new ProxyImplRequest(2000, interceptorHandler, headerFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        req.query.foo = 'bar';
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.at/foo');

        expect(res.body).toBe('test response');
    });

    it('allows request interceptors to rewrite the target uri',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(200, 'test response');

        const interceptors: Array<MashroomHttpProxyInterceptorHolder> = [
            {
                order: 1000,
                pluginName: 'Interceptor 1',
                interceptor: {
                    async interceptRequest() {
                        return {
                            rewrittenTargetUri: 'https://www.mashroom-server.com/foo',
                        };
                    },
                    async interceptResponse() {
                        return null;
                    }
                }
            }
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['another-header']);

        const httpProxy = new ProxyImplRequest(2000, interceptorHandler, headerFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, '__MASHROOM_SERVER__');

        expect(res.body).toBe('test response');
    });

    it('allows interceptor to handle the request',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(200, 'test response');

        const interceptors: Array<MashroomHttpProxyInterceptorHolder> = [
            {
                order: 1000,
                pluginName: 'Interceptor 1',
                interceptor: {
                    async interceptRequest(targetUri: string, existingHeaders: Readonly<HttpHeaders>, existingQueryParams: Readonly<QueryParams>,
                                     clientRequest: Request, clientResponse: Response) {
                        clientResponse.sendStatus(403);

                        return {
                           responseHandled: true,
                        };
                    },
                    async interceptResponse() {
                        return null;
                    }
                }
            }
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['another-header']);

        const httpProxy = new ProxyImplRequest(2000, interceptorHandler, headerFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.statusCode).toBe(403);
    });

    it('adds headers from response interceptors',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo2')
            .reply(200, 'test response', {
                'x-whatever': '123',
            });

        const interceptors: Array<MashroomHttpProxyInterceptorHolder> = [
            {
                order: 1000,
                pluginName: 'Interceptor 1',
                interceptor: {
                    async interceptRequest() {
                        return null;
                    },
                    async interceptResponse() {
                        return {
                            addHeaders: {
                                'some-new-header': 'XXXXXXXX',
                            }
                        };
                    }
                }
            },
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['x-whatever', 'some-new-header']);

        const httpProxy = new ProxyImplRequest(2000, interceptorHandler, headerFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo2');

        expect(res.headers).toEqual({
            'x-whatever': '123',
            'some-new-header': 'XXXXXXXX',
        });
    });

    it('allows response interceptors to remove headers',  async () => {
        nock('https://www.mashroom-server.com', {
            badheaders: ['another-header']
        })
            .get('/foo3')
            .reply(200, 'test response', {
                'x-whatever': '123',
                'foo': 'bar',
            });

        const interceptors: Array<MashroomHttpProxyInterceptorHolder> = [
            {
                order: 1000,
                pluginName: 'Interceptor 1',
                interceptor: {
                    async interceptRequest() {
                        return null;
                    },
                    async interceptResponse() {
                        return {
                            removeHeaders: ['foo']
                        };
                    }
                }
            }
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['x-whatever', 'foo']);

        const httpProxy = new ProxyImplRequest(2000, interceptorHandler, headerFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo3');

        expect(res.headers).toEqual({
            'x-whatever': '123'
        });
    });

    it('it rejects requests with invalid HTTP protocols', async () => {
        const headerFilter = new HttpHeaderFilter([]);
        const httpProxy = new ProxyImplRequest(2000, noopInterceptorHandler, headerFilter, false, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'file:///foo/test.exe');

        expect(res.statusCode).toBe(502);
    });
});
