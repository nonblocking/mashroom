// Tests without any instrumentation (nock would confuse the tests here)

import {Readable, Writable} from 'stream';
import {createServer as createHttpServer, request} from 'http';
import WebSocket from 'ws';
import {loggingUtils} from '@mashroom/mashroom-utils';
import ProxyImplNodeHttpProxy from '../../src/proxy/ProxyImplNodeHttpProxy';
import InterceptorHandler from '../../src/proxy/InterceptorHandler';
import HttpHeaderFilter from '../../src/proxy/HttpHeaderFilter';

import type {Server} from 'http';
import type {Socket} from 'net';
import type {IncomingMessageWithContext} from '@mashroom/mashroom/type-definitions';

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

    it('sets the correct status code if the target is not available', async () => {
        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxy.forward(req, res, 'https://localhost:22334/foo');

        // Expect 502 Bad Gateway
        expect(res.statusCode).toBe(502);
    });

    it('sets the correct status code if the connection times out', async () => {
        const server = createHttpServer(async (req, res) => {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            res.end();
        });
        server.listen(22222);

        try {
            const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

            const req = createDummyRequest('GET');
            const res = createDummyResponse();

            await httpProxy.forward(req, res, 'http://localhost:22222/foo');

            // Expect 504 Gateway Timeout
            expect(res.statusCode).toBe(504);
        } finally {
            server.close();
        }
    });

    it('aborts correctly if the client closes the connection before the target sent the headers', async () => {
        const consoleInfo = console.info = jest.fn();
        const server = createHttpServer(async (req, res) => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            res.end();
        });
        server.listen(22223);

        try {
            const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

            const req = createDummyRequest('GET');
            const res = createDummyResponse();

            const promise = httpProxy.forward(req, res, 'http://localhost:22223/foo');

            await new Promise((resolve) => setTimeout(resolve, 500));

            res.destroy();

            await promise;

            expect(consoleInfo.mock.calls[2][0]).toBe('Request aborted by client: \'http://localhost:22223/foo\'');
        } finally {
            server.close();
        }
    });

    it('aborts correctly if the client closes the connection before the target sent the body', async () => {
        const consoleInfo = console.info = jest.fn();

        const server = createHttpServer(async (req, res) => {
            res.writeHead(200);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            res.end();
        });
        server.listen(22224);

        try {
            const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

            const req = createDummyRequest('GET');
            const res = createDummyResponse();

            const promise = httpProxy.forward(req, res, 'http://localhost:22224/foo');

            await new Promise((resolve) => setTimeout(resolve, 500));

            res.destroy();

            await promise;

            expect(consoleInfo.mock.calls[2][0]).toBe('Request aborted by client: \'http://localhost:22224/foo\'');

        } finally {
            server.close();
        }
    });

    // This confuses for some reason other tests
    it.skip('aborts correctly if the client aborts sending the request body', async () => {
        const consoleInfo = console.info = jest.fn();

        const targetServer = createHttpServer(async (req, res) => {
            // Read client data
            for await (const chunk of req) {
                console.info(`Received chunk: ${Buffer.from(chunk).toString('utf-8')}`);
            }
            res.end();
        });
        targetServer.listen(22225);

        const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, false, null, null, null, false, loggingUtils.dummyLoggerFactory);

        let promise;
        const server = createHttpServer((req, res) => {
            (req as any).pluginContext = {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                },
            };
            promise = httpProxy.forward(req as any, res as any, 'http://localhost:22225/foo');
        });
        server.listen(22233);

        try {
            const clientRequest = request('http://localhost:22233', {
                method: 'POST',
            });
            clientRequest.on('error', (e) => {
            });
            clientRequest.write('here some data');
            await new Promise((resolve) => setTimeout(resolve, 500));
            // The client aborts before all data has been sent
            clientRequest.destroy();

            await promise;

            expect(consoleInfo.mock.calls[3][0]).toBe('Request aborted by client: \'http://localhost:22225/foo\'');
        } finally {
            targetServer.close();
            server.close();
        }
    });

    it('retries if the target resets the connection',  async () => {
        let requestCount = 0;
        const server = createHttpServer(async (req, res) => {
            if (requestCount === 0) {
                req.destroy();
                requestCount ++;
                return;
            }
            res.writeHead(201);
            res.end();
        });
        server.listen(22226);

        try {
            const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, true, null, null, null, false, loggingUtils.dummyLoggerFactory);

            const req = createDummyRequest('GET');
            const res = createDummyResponse();

            await httpProxy.forward(req, res, 'http://localhost:22226/foo');

            expect(res.statusCode).toBe(201);
        } finally {
            server.close();
        }
    });

    it('stops after 2 retries',  async () => {
        const server = createHttpServer(async (req, res) => {
            req.destroy();
        });
        server.listen(22227);

        try {
            const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, removeAllHeaderFilter, true, null, null, null, false, loggingUtils.dummyLoggerFactory);

            const req = createDummyRequest('GET');
            const res = createDummyResponse();

            await httpProxy.forward(req, res, 'http://localhost:22227/foo');

            expect(res.statusCode).toBe(502);
        } finally {
            server.close();
        }
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

    // This test accesses a remote server
    it.skip('forwards WebSocket connections to echo server',  (done) => {
        (async () => {
            const headerFilter = new HttpHeaderFilter([
               'sec-websocket-*',
            ]);
            const httpProxy = new ProxyImplNodeHttpProxy(2000, false, noopInterceptorHandler, headerFilter, false, 10, 10, null, true,loggingUtils.dummyLoggerFactory);

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
                });
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
            });
        })();
    });

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

        const pluginRegistry: any = {
            interceptors: [],
        };
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
