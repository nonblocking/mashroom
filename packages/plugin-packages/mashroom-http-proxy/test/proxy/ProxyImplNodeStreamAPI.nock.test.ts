// Tests with nock instrumentation

import {Readable, Transform, Writable} from 'stream';
import zlib from 'zlib';
import nock from 'nock';
import {loggingUtils} from '@mashroom/mashroom-utils';
import ProxyImplNodeStreamAPI from '../../src/proxy/ProxyImplNodeStreamAPI';
import InterceptorHandler from '../../src/proxy/InterceptorHandler';
import HttpHeaderFilter from '../../src/proxy/HttpHeaderFilter';
import type { TransformOptions} from 'stream';

import type {Request, Response} from 'express';
import type {HttpHeaders, QueryParams} from '../../type-definitions';
import type {MashroomHttpProxyInterceptorHolder} from '../../type-definitions/internal';

const createDummyRequest = (method: string, data?: string) => {
    const req: any = new Readable();
    req.url = '/whatever';
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
    req.socket = {
        remoteAddress: '1.2.3.4',
        setTimeout: () => { /* nothing to do */ },
        setKeepAlive: () => { /* nothing to do */ },
        destroy: () => { /* nothing to do */ },
    };
    req.connection = {
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

describe('ProxyImplNodeStreamAPI', () => {

    beforeEach(() => {
        nock.cleanAll();
    });

    it('forwards HTTP GET request to the target URI', async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                foo: 'bar',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo', {
            foo: 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('sets the correct forwarded-for headers', async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                foo: 'bar',
                'x-forwarded-proto': 'http',
                'x-forwarded-for': '1.2.3.4',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, true, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo', {
            foo: 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('takes existing forwarded-for headers into consideration', async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                foo: 'bar',
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'test.com',
                'x-forwarded-for': '10.0.0.3, 1.2.3.4',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, true, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        req.headers['x-forwarded-for'] = '10.0.0.3';
        req.headers['x-forwarded-host'] = 'test.com';
        req.headers['x-forwarded-proto'] = 'https';
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo', {
            foo: 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('forwards HTTP POST request to the target URI', async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                foo: 'bar',
            },
        })
            .post('/login', (body) => {
                return body.user === 'test';
            })
            .reply(200, 'test post response');

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('POST', JSON.stringify({ user: 'test' }));
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/login', {
            foo: 'bar',
        });

        expect(res.body).toBe('test post response');
    });

    it('forwards query parameters for HTTP requests', async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo?q=javascript%205')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

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

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        req.query = {
            q: 'javascript 5'
        };

        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo?bar=2');

        expect(res.body).toBe('test response');
    });

    it('passes the response from the target endpoint',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(201, 'resource created');

            const httpProxy = new ProxyImplNodeStreamAPI(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

            const req = createDummyRequest('GET');
            const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

            expect(res.statusCode).toBe(201);
    });

    it('adds headers from request interceptors', async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                authorization: 'Bearer XXXXXXXX',
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
                                authorization: 'Bearer XXXXXXXX',
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

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false,interceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('allows request interceptors to remove headers', async () => {
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

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('adds query params from request interceptors', async () => {
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
                                foo: 'bar',
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

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, interceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('allows request interceptors to remove query params', async () => {
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

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        req.query.foo = 'bar';
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.at/foo');

        expect(res.body).toBe('test response');
    });

    it('allows request interceptors to rewrite the target uri', async () => {
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

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, '__MASHROOM_SERVER__');

        expect(res.body).toBe('test response');
    });

    it('allows interceptor to handle the request', async () => {
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

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.statusCode).toBe(403);
    });

    it('adds headers from response interceptors', async () => {
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

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo2');

        expect(res.headers).toEqual({
            'x-whatever': '123',
            'some-new-header': 'XXXXXXXX',
        });
    });

    it('allows response interceptors to remove headers', async () => {
        nock('https://www.mashroom-server.com', {
            badheaders: ['another-header']
        })
            .get('/foo3')
            .reply(200, 'test response', {
                'x-whatever': '123',
                foo: 'bar',
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

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo3');

        expect(res.headers).toEqual({
            'x-whatever': '123'
        });
    });

    it('allows interceptors to transform the request and response stream', async () => {
        nock('https://www.mashroom-server.com')
            .post('/foo4', (b) => b.toString() === 'TEST REQUEST')
            .reply(200, 'test response');

        const transformToUpperCase: TransformOptions = {
            transform(chunk, encoding, callback) {
                this.push(chunk.toString().toUpperCase());
                callback();
            }
        };

        const interceptors: Array<MashroomHttpProxyInterceptorHolder> = [
            {
                order: 1000,
                pluginName: 'Interceptor 2',
                interceptor: {
                    async interceptRequest() {
                        return {
                            streamTransformers: [new Transform(transformToUpperCase)],
                        };
                    },
                    async interceptResponse() {
                        return {
                            streamTransformers: [new Transform(transformToUpperCase)],
                        };
                    }
                }
            }
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, interceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('POST', 'test request');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo4');

        expect(res.body).toBe('TEST RESPONSE');
    });

    it('allows multiple stream transformers', async () => {
        const requestData = 'test request';

        let reqBody: Buffer | undefined;
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'content-encoding': 'gzip',
            },
        })
            .post('/foo4')
            .reply((uri, body, cb) => {
                reqBody = Buffer.from(body as string, 'hex');
                cb(null, [200, reqBody, {
                    'content-encoding': 'gzip',
                }]);
            });

        const transformToUpperCase: TransformOptions = {
            transform(chunk, encoding, callback) {
                this.push(chunk.toString().toUpperCase());
                callback();
            }
        };
        const transformToLowerCse: TransformOptions = {
            transform(chunk, encoding, callback) {
                this.push(chunk.toString().toLowerCase());
                callback();
            }
        };

        const interceptors: Array<MashroomHttpProxyInterceptorHolder> = [
            {
                order: 1000,
                pluginName: 'Interceptor 2',
                interceptor: {
                    async interceptRequest(targetUri) {
                        if (targetUri.startsWith('https://www.mashroom-server.com')) {
                            return {
                                addHeaders: {
                                    'content-encoding': 'gzip',
                                },
                                streamTransformers: [
                                    new Transform(transformToUpperCase),
                                    zlib.createGzip(), // compress
                                ],
                            };
                        }
                    },
                    async interceptResponse(targetUri, existingHeaders) {
                        if (targetUri.startsWith('https://www.mashroom-server.com') && existingHeaders['content-encoding'] === 'gzip') {
                            return {
                                removeHeaders: [
                                    'content-encoding',
                                ],
                                streamTransformers: [
                                    zlib.createGunzip(), // uncompress
                                    new Transform(transformToLowerCse)
                                ],
                            };
                        }
                    }
                }
            },
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);

        const httpProxy = new ProxyImplNodeStreamAPI(2000, false, interceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('POST', requestData);
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo4');

        expect(reqBody).toBeTruthy();
        expect(reqBody!.length).not.toBe(requestData.length);
        expect(res.body).toBe(requestData);
    });

});
