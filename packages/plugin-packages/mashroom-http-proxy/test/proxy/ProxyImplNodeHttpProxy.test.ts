
import {Readable, Writable} from 'stream';
import {createServer as createHttpServer, request} from 'http';
import WebSocket from 'ws';
import nock from 'nock';
import {loggingUtils} from '@mashroom/mashroom-utils';
import ProxyImplNodeHttpProxy from '../../src/proxy/ProxyImplNodeHttpProxy';
import InterceptorHandler from '../../src/proxy/InterceptorHandler';
import HttpHeaderFilter from '../../src/proxy/HttpHeaderFilter';

import type {Server} from 'http';
import type {Socket} from 'net';
import type {Request, Response} from 'express';
import type {IncomingMessageWithContext} from '@mashroom/mashroom/type-definitions';
import type {HttpHeaders, QueryParams} from '../../type-definitions';
import type {MashroomHttpProxyInterceptorHolder} from '../../type-definitions/internal';

jest.mock('../../src/connection-pool', () => {
    const originalModule = jest.requireActual('../../src/connection-pool');
    return {
        __esModule: true, // Use it when dealing with esModules
        ...originalModule,
        getWaitingRequestsForHostHeader: () => 10,
    };
});

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
        setNoDelay: () => { /* nothing to do */ },
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

describe('ProxyImplNodeHttpProxy', () => {

    beforeEach(() => {
        nock.cleanAll();
    });

    it('forwards HTTP GET request to the target URI',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                foo: 'bar',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo', {
            foo: 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('sets the correct forwarded-for headers',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                foo: 'bar',
                'x-forwarded-proto': 'http',
                'x-forwarded-for': '1.2.3.4',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, true, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo', {
            foo: 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('takes existing forwarded-for headers into consideration',  async () => {
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

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, true, loggingUtils.dummyLoggerFactory);

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

    it('forwards HTTP POST request to the target URI',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                foo: 'bar',
            },
        })
            .post('/login', (body) => {
                return body.user === 'test';
            })
            .reply(200, 'test post response');

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('POST', '{ "user": "test" }');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/login', {
            foo: 'bar',
        });

        expect(res.body).toBe('test post response');
    });

    it('forwards query parameters for HTTP requests',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo?q=javascript%205')
            .reply(200, 'test response');

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

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

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        req.query = {
            q: 'javascript 5'
        };

        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo?bar=2');

        expect(res.body).toBe('test response');
    });

    it('sets the correct status code if the target is not available', async () => {
        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://localhost:22334/foo');

        // Expect 502 Bad Gateway
        expect(res.statusCode).toBe(502);
    });

    it('sets the correct status code if the connection times out', async () => {
        nock('https://www.yyyyyyyyyyy.at')
            .get('/')
            .delayConnection(3000)
            .reply(200, 'test response');

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.yyyyyyyyyyy.at');

        // Expect 504 Gateway Timeout
        expect(res.statusCode).toBe(504);

        // Wait until the nock responses, otherwise we would have an open handle
        await new Promise((resolve) => setTimeout(resolve, 3000));
    });

    it('aborts correctly if the client closes the connection before the target sent the headers', async () => {
        const consoleInfo = console.info = jest.fn();

        nock('https://www.fooooo.com')
            .get('/')
            .delayConnection(1000)
            .reply(200, {});

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        const promise = httpProxy.forward(req, res, 'https://www.fooooo.com');

        await new Promise((resolve) => setTimeout(resolve, 500));

        res.destroy();

        await promise;

        expect(consoleInfo.mock.calls[2][0]).toBe('Request aborted by client: \'https://www.fooooo.com\'');
    });

    it('aborts correctly if the client closes the connection before the target sent the body', async () => {
        const consoleInfo = console.info = jest.fn();

        nock('https://www.fooooo.com')
            .get('/')
            .delayBody(1000)
            .reply(200, {});

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        const promise = httpProxy.forward(req, res, 'https://www.fooooo.com');

        await new Promise((resolve) => setTimeout(resolve, 500));

        res.destroy();

        await promise;

        expect(consoleInfo.mock.calls[3][0]).toBe('Request aborted by client: \'https://www.fooooo.com\'');
    });

    it('aborts correctly if the client aborts sending the request body', async () => {
        const consoleInfo = console.info = jest.fn();

        nock('https://www.fooooo.com')
            .post('/bar')
            .reply(200, {});

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        let promise;
        const server = createHttpServer((req, res) => {
            (req as any).pluginContext = {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                },
            };
            promise = httpProxy.forward(req as any, res as any, 'https://www.fooooo.com/bar');
        });
        server.listen(22233);

        const clientRequest = request('http://localhost:22233', {
            method: 'POST',
        });
        clientRequest.on('error', (e) => {});
        clientRequest.write('here some data');
        await new Promise((resolve) => setTimeout(resolve, 500));
        // The client aborts before all data hase been sent
        clientRequest.destroy();

        server.close();
        await promise;

        expect(consoleInfo.mock.calls[2][0]).toBe('Request aborted by client: \'https://www.fooooo.com/bar\'');
    });

    it('passes the response from the target endpoint',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(201, 'resource created');

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.statusCode).toBe(201);
    });

    it('retries if the target resets the connection',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .replyWithError({ code: 'ECONNRESET' });
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(201, 'resource created');

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, true, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.statusCode).toBe(201);
    });

    it('stops after 2 retries',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .replyWithError({ code: 'ECONNRESET' });
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .replyWithError({ code: 'ECONNRESET' });
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .replyWithError({ code: 'ECONNRESET' });

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, true, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.statusCode).toBe(502);
    });

    it('adds headers from request interceptors',  async () => {
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

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false,interceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

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

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

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

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

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

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

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

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

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

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

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

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

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

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo3');

        expect(res.headers).toEqual({
            'x-whatever': '123'
        });
    });

    it('rejects requests if too many are already waiting', async () => {
        const headerFilter = new HttpHeaderFilter([]);

        // We configure max 2 waiting but the getWaitingRequestsForHostHeader() mock returns 10
        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, headerFilter, false, 10, 10, 2, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.statusCode).toBe(429);
    });

    it('rejects requests with invalid HTTP protocols', async () => {
        const headerFilter = new HttpHeaderFilter([]);
        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, headerFilter, false, 10, 10, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'file:///foo/test.exe');

        expect(res.statusCode).toBe(502);
    });

    it('forwards WebSocket connections to the target URI',  (done) => {
        (async () => {
            const headerFilter = new HttpHeaderFilter([
                'sec-websocket-*',
            ]);
            const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, headerFilter, false, 10, 10, null, false, loggingUtils.dummyLoggerFactory);

            const proxyServer = await new Promise<Server>((resolve, reject) => {
                const server = createHttpServer();
                server.on('error', (e) => reject(e));
                server.on('upgrade', (req: IncomingMessageWithContext, socket: Socket, head) => {
                    console.info('Received upgrade request');
                    req.pluginContext = {
                        loggerFactory: loggingUtils.dummyLoggerFactory,
                        services: {}
                    } as any;
                    httpProxy.forwardWs(req, socket, head, 'ws://localhost:30001?test=1', {
                        foo: '2'
                    });
                });
                server.listen(30003, () => resolve(server));
            });

            const targetWsServer = new WebSocket.Server(({port: 30001}));

            const client = new WebSocket('ws://localhost:30003?test=1');
            client.on('error', (error) => {
                console.error('WS client connection error', error);
            });
            client.on('open', () => {
                client.send('hello server');
            });

            targetWsServer.on('connection', (ws, req) => {
                console.info('Client connected');
                ws.on('message', async (message) => {
                    expect(req.url).toBe('/?test=1');
                    expect(req.headers.foo).toBe('2');
                    expect(message.toString()).toBe('hello server');
                    expect(httpProxy.getWSConnectionMetrics()?.activeConnections).toBe(1);
                    expect(httpProxy.getWSConnectionMetrics()?.activeConnectionsTargetCount).toEqual({
                        'ws://localhost:30001': 1,
                    });

                    client.close();
                    proxyServer.close();
                    targetWsServer.close();
                    done();
                });
            });
        })();
    });

    /*
    it('forwards WebSocket connections to echo server',  (done) => {
        (async () => {
            const headerFilter = new HttpHeaderFilter([
               'sec-websocket-*',
            ]);
            const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, headerFilter, false, 10, 10, null, loggingUtils.dummyLoggerFactory);

            const proxyServer = await new Promise<Server>((resolve, reject) => {
                const server = createHttpServer();
                server.on('error', (e) => reject(e));
                server.on('upgrade', (req: IncomingMessageWithContext, socket: Socket, head) => {
                    console.info('Received upgrade request');
                    req.pluginContext = {
                        loggerFactory: loggingUtils.dummyLoggerFactory,
                        services: {}
                    } as any;
                    httpProxy.forwardWs(req, socket, head, 'ws://ws.ifelse.io/', {

                    });
                })
                server.listen(30007, () => resolve(server));
            });

            const client = new WebSocket('ws://localhost:30007');
            client.on('error', (error) => {
                console.error('WS client connection error', error);
            });
            client.on('open', () => {
                console.info('Client connected');
                client.send('hello echo');
            });
            client.on('message', (message) => {
                if (message.toString().startsWith('Request served by')) {
                    return;
                }
                expect(message.toString()).toBe('hello echo');
                client.close();
                proxyServer.close();
                done();
            })
        })();
    });
     */

    it('processes WebSocket target errors',  (done) => {
        (async () => {
            const headerFilter = new HttpHeaderFilter([
                'sec-websocket-*',
            ]);
            const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, headerFilter, false, 10, 10, null, false, loggingUtils.dummyLoggerFactory);

            const proxyServer = await new Promise<Server>((resolve, reject) => {
                const server = createHttpServer();
                server.on('error', (e) => reject(e));
                server.on('upgrade', (req: IncomingMessageWithContext, socket: Socket, head) => {
                    console.info('Received upgrade request');
                    req.pluginContext = {
                        loggerFactory: loggingUtils.dummyLoggerFactory,
                        services: {}
                    } as any;
                    httpProxy.forwardWs(req, socket, head, 'ws://localhost:30333', {
                        foo: '2'
                    });
                });
                server.listen(30033, () => resolve(server));
            });

            const client = new WebSocket('ws://localhost:30033');
            client.on('error', (error) => {
                expect(error.message).toBe('Unexpected server response: 502');
                proxyServer.close();
                done();
            });
            client.on('open', () => {
                client.send('hello server');
            });
        })();
    });

    it('does not process unknown protocol upgrades',  async () => {
        const req = createDummyRequest('GET');
        req.headers.upgrade = 'whatever';
        const head = Buffer.from('');

        const pluginRegistry: any = {};
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter([]);
        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        await expect(httpProxy.forwardWs(req, req.socket, head, 'ws://www.mashroom-server.com/ws')).rejects.toThrow('Upgrade not supported: whatever');
    });

    it('respects WebSocket connection limits',  async () => {
        const req = createDummyRequest('GET');
        req.headers.upgrade = 'websocket';
        const socket: any = {
            end: jest.fn(),
        };
        req.socket = socket;
        const head = Buffer.from('');

        const headerFilter = new HttpHeaderFilter([]);
        const httpProxy1 = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, headerFilter, false, 0, 10, null, false, loggingUtils.dummyLoggerFactory);
        const httpProxy2 = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, headerFilter, false, 10, 0, null, false, loggingUtils.dummyLoggerFactory);

        await httpProxy1.forwardWs(req, socket, head, 'ws://www.mashroom-server.com/ws');

        expect(socket.end.mock.calls.length).toBe(1);
        expect(socket.end.mock.calls[0][0]).toBe('HTTP/1.1 429 Too Many Requests\r\n\r\n');

        socket.end.mockReset();

        await httpProxy2.forwardWs(req, socket, head, 'ws://www.mashroom-server.com/ws');

        expect(socket.end.mock.calls.length).toBe(1);
        expect(socket.end.mock.calls[0][0]).toBe('HTTP/1.1 429 Too Many Requests\r\n\r\n');
    });

    it('rejects requests with invalid WS protocols', async () => {
        const req = createDummyRequest('GET');
        req.headers.upgrade = 'websocket';
        const socket: any = {
            end: jest.fn(),
        };
        req.socket = socket;
        const head = Buffer.from('');

        const headerFilter = new HttpHeaderFilter([]);
        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, headerFilter, false, 10, 10, null, false, loggingUtils.dummyLoggerFactory);

        await httpProxy.forwardWs(req, socket, head, 'foo://test.a1');

        expect(socket.end.mock.calls.length).toBe(1);
        expect(socket.end.mock.calls[0][0]).toBe('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

});
