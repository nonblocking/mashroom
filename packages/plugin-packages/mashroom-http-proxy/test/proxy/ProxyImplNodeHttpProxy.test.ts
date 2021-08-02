
import {Readable, Writable} from 'stream';
import {createServer as createHttpServer} from 'http';
import WebSocket from 'ws';
import nock from 'nock';
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import ProxyImplNodeHttpProxy from '../../src/proxy/ProxyImplNodeHttpProxy';
import InterceptorHandler from '../../src/proxy/InterceptorHandler';
import HttpHeaderFilter from '../../src/proxy/HttpHeaderFilter';

import type {Server} from 'http';
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
        loggerFactory,
        services: {

        },
    };
    req.socket = {
        setTimeout: () => { /* nothing to do */ },
        setNoDelay: () => { /* nothing to do */ },
        setKeepAlive: () => { /* nothing to do */ },
        destroy: () => { /* nothing to do */ },
    };
    req.connection = {};

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

    it('forwards HTTP GET request to the target URI',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'foo': 'bar',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo', {
            'foo': 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('forwards HTTP POST request to the target URI',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'foo': 'bar',
            },
        })
            .post('/login')
            .reply(200, 'test post response');

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

        const req = createDummyRequest('POST', '{ "user": "test }');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/login', {
            'foo': 'bar',
        });

        expect(res.body).toBe('test post response');
    });

    it('forwards query parameters for HTTP requests',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo?q=javascript%205')
            .reply(200, 'test response');

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

        const req = createDummyRequest('GET');
        req.query = {
            q: 'javascript 5'
        };

        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('sets the correct status code if the target is not available', async () => {
        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.xxxxxxxxxxxxxxxxxxs.at');

        // Expect 503 Service Unavailable
        expect(res.statusCode).toBe(503);
    });

    it('passes the response from the target endpoint',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(201, 'resource created');

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo')

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
                        }
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
                        }
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

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false,interceptorHandler, removeAllHeaderFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

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
                        }
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
        const headerFilter = new HttpHeaderFilter(['another-header'])

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

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
                        }
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

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, removeAllHeaderFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

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
                        }
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
        const headerFilter = new HttpHeaderFilter(['another-header'])

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, loggerFactory);

        const req = createDummyRequest('GET');
        req.query.foo = 'bar';
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.at/foo');

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
                        }
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
        const headerFilter = new HttpHeaderFilter(['another-header'])

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, '__MASHROOM_SERVER__');

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
                        }
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
        const headerFilter = new HttpHeaderFilter(['another-header'])

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

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
                        }
                    }
                }
            },
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['x-whatever', 'some-new-header'])

        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo2');

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
                        }
                    }
                }
            }
        ];
        const pluginRegistry: any = {
            interceptors,
        };
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter(['x-whatever', 'foo'])
        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo3');

        expect(res.headers).toEqual({
            'x-whatever': '123'
        });
    });

    it('forwards WebSocket connections to the target URI',  (done) => {
        (async () => {
            const pluginRegistry: any = {};
            const interceptorHandler = new InterceptorHandler(pluginRegistry);
            const headerFilter = new HttpHeaderFilter([])
            const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, loggerFactory);

            const targetServer = await new Promise<Server>((resolve, reject) => {
                const server = createHttpServer();
                server.on('error', (e) => reject(e));
                server.listen(30001, () => resolve(server));
            })
            const proxyServer = await new Promise<Server>((resolve, reject) => {
                const server = createHttpServer();
                server.on('error', (e) => reject(e));
                server.on('upgrade', (req, socket, head) => {
                    console.info('Received upgrade request');
                    req.pluginContext = {
                        loggerFactory,
                        services: {}
                    }
                    httpProxyService.forwardWs(req, socket, head, 'ws://localhost:30001?test=1', {
                        foo: '2'
                    });
                })
                server.listen(30003, () => resolve(server));
            });

            const targetWsServer = new WebSocket.Server(({server: targetServer}));

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
                    expect(message).toBe('hello server');
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
            const pluginRegistry: any = {};
            const interceptorHandler = new InterceptorHandler(pluginRegistry);
            const headerFilter = new HttpHeaderFilter([])
            const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, loggerFactory);

            const proxyServer = await new Promise<Server>((resolve, reject) => {
                const server = createHttpServer();
                server.on('error', (e) => reject(e));
                server.on('upgrade', (req, socket, head) => {
                    console.info('Received upgrade request');
                    req.pluginContext = {
                        loggerFactory,
                        services: {}
                    }
                    httpProxyService.forwardWs(req, socket, head, 'ws://echo.websocket.org/', {

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
                expect(message).toBe('hello echo');
                client.close();
                proxyServer.close();
                done();
            })
        })();
    });
     */

    it('processes WebSocket forwarding errors',  (done) => {
        (async () => {
            const pluginRegistry: any = {};
            const interceptorHandler = new InterceptorHandler(pluginRegistry);
            const headerFilter = new HttpHeaderFilter([])
            const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, loggerFactory);

            const proxyServer = await new Promise<Server>((resolve, reject) => {
                const server = createHttpServer();
                server.on('error', (e) => reject(e));
                server.on('upgrade', (req, socket, head) => {
                    console.info('Received upgrade request');
                    req.pluginContext = {
                        loggerFactory,
                        services: {}
                    }
                    httpProxyService.forwardWs(req, socket, head, 'ws://localhost:30333', {
                        foo: '2'
                    });
                })
                server.listen(30033, () => resolve(server));
            });

            const client = new WebSocket('ws://localhost:30033');
            client.on('error', (error) => {
                expect(error.message).toBe('Unexpected server response: 503');
                proxyServer.close();
                done();
            });
            client.on('open', () => {
                client.send('hello server');
            });
        })();
    });

    it('does not process unknown protocol upgrades',  async () => {
        const req = createDummyRequest('GET')
        req.headers.upgrade = 'whatever';
        const head = Buffer.from('');

        const pluginRegistry: any = {};
        const interceptorHandler = new InterceptorHandler(pluginRegistry);
        const headerFilter = new HttpHeaderFilter([])
        const httpProxyService = new ProxyImplNodeHttpProxy(2000, false, interceptorHandler, headerFilter, loggerFactory);

        await expect(httpProxyService.forwardWs(req, req.socket, head, 'ws://www.mashroom-server.com/ws')).rejects.toThrowError('Upgrade not supported: whatever');
    });
});
