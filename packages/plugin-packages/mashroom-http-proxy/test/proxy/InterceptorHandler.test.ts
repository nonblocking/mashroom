
import {loggingUtils} from '@mashroom/mashroom-utils';
import InterceptorHandler from '../../src/proxy/InterceptorHandler';
import type {MashroomHttpProxyInterceptor} from '../../type-definitions';

const interceptor1: MashroomHttpProxyInterceptor = {
    async interceptRequest() {
        return {
            rewrittenTargetUri: 'https://one.com',
            addHeaders: {
                'X-Foo': 'bar',
                'invalid': null as any,  // invalid!
            },
            addQueryParams: {
                'q': 'x'
            },
            removeHeaders: ['accept'],
        };
    },
    async interceptWsRequest() {
        return {
            rewrittenTargetUri: 'wss://whatever.com/',
            addHeaders: {
                'X-Foo': 'bar',
            },
            addQueryParams: {
                'q': 'x'
            },
            removeHeaders: ['accept'],
        };
    },
    async interceptResponse() {
        return {
            addHeaders: {
                'X-Foo': 'bar',
            },
        };
    }
};

const interceptor2: MashroomHttpProxyInterceptor = {
    async interceptRequest(rewrittenTargetUri: string) {
        return {
            rewrittenTargetUri: `${rewrittenTargetUri  }/two`,
            addHeaders: {
                'X-Whatever': '123',
            },
            addQueryParams: {
                'foo': '1'
            },
        };
    },
    async interceptResponse() {
        return {
            addHeaders: {
                'X-Whatever': '123',
            },
        };
    }
};

const interceptor3: MashroomHttpProxyInterceptor = {
    async interceptRequest() {
        return {
            removeHeaders: ['x'],
            removeQueryParams: ['x']
        };
    },
    async interceptResponse() {
        return {
            removeHeaders: ['x'],
        };
    }
};

const interceptor4: MashroomHttpProxyInterceptor = {
    async interceptRequest() {
        return {
            responseHandled: true,
        };
    },
};

const interceptor5: MashroomHttpProxyInterceptor = {
    async interceptResponse() {
        return {
            responseHandled: true,
        };
    }
};

const pluginRegistry1: any = {
    interceptors: [
        { pluginName: 'A', interceptor: interceptor1 },
        { pluginName: 'B', interceptor: interceptor2 },
        { pluginName: 'C', interceptor: interceptor3 },
    ],
};

const pluginRegistry2: any = {
    interceptors: [
        { pluginName: 'A', interceptor: interceptor1 },
        { pluginName: 'X', interceptor: interceptor4 },
        { pluginName: 'B', interceptor: interceptor2 },
        { pluginName: 'C', interceptor: interceptor3 },
    ],
};

const pluginRegistry3: any = {
    interceptors: [
        { pluginName: 'A', interceptor: interceptor1 },
        { pluginName: 'Y', interceptor: interceptor5 },
        { pluginName: 'B', interceptor: interceptor2 },
        { pluginName: 'C', interceptor: interceptor3 },
    ],
};

describe('InterceptorHandler', () => {

    it('processes the request interceptors', async () => {
        const clientRequest: any = {
            headers: {
                existing1: '1',
                existing2: '2',
            },
            query: {
                existing1: '1',
            }
        };
        const clientResponse: any = {

        };
        const handler = new InterceptorHandler(pluginRegistry1);
        const result = await handler.processHttpRequest(clientRequest, clientResponse, 'https://www.mashroom.com', { 'extra-header': '2' }, loggingUtils.dummyLoggerFactory());

        expect(result).toEqual({
            addHeaders: {
                'X-Foo': 'bar',
                'X-Whatever': '123'
            },
            addQueryParams: {
                'foo': '1',
                'q': 'x'
            },
            removeHeaders: [
                'accept',
                'x'
            ],
            removeQueryParams: [
                'x'
            ],
            rewrittenTargetUri: 'https://one.com/two'
        });
    });

    it('processes the request interceptors for upgrade requests (WebSockets)', async () => {
        const clientRequest: any = {
            headers: {
                existing1: '1',
                existing2: '2',
            },
        };
        const handler = new InterceptorHandler(pluginRegistry1);
        const result = await handler.processWsRequest(clientRequest, 'https://www.mashroom.com', { 'extra-header': '2' }, loggingUtils.dummyLoggerFactory());

        expect(result).toEqual({
            addHeaders: {
                'X-Foo': 'bar',
            },
            removeHeaders: [
                'accept',
            ],
            rewrittenTargetUri: 'wss://whatever.com/'
        });
    });

    it('processes the request interceptors with responseHandled', async () => {
        const clientRequest: any = {
        };
        const clientResponse: any = {
        };
        const handler = new InterceptorHandler(pluginRegistry2);
        const result = await handler.processHttpRequest(clientRequest, clientResponse, 'https://www.mashroom.com', { 'extra-header': '2' }, loggingUtils.dummyLoggerFactory());

        expect(result).toEqual({
            responseHandled: true,
        });
    });

    it('processes the response interceptors', async () => {
        const clientRequest: any = {
        };
        const targetResponse: any = {
            headers: {
                existing1: '1',
                existing2: '2',
            },
        };
        const clientResponse: any = {
        };
        const handler = new InterceptorHandler(pluginRegistry1);
        const result = await handler.processHttpResponse(clientRequest, clientResponse, 'https://www.mashroom.com', targetResponse, loggingUtils.dummyLoggerFactory());

        expect(result).toEqual({
            addHeaders: {
                'X-Foo': 'bar',
                'X-Whatever': '123'
            },
            removeHeaders: [
                'x'
            ],
        });
    });

    it('processes the response interceptors with responseHandled', async () => {
        const clientRequest: any = {
        };
        const targetResponse: any = {
        };
        const clientResponse: any = {
        };
        const handler = new InterceptorHandler(pluginRegistry3);
        const result = await handler.processHttpResponse(clientRequest, clientResponse, 'https://www.mashroom.com', targetResponse, loggingUtils.dummyLoggerFactory());

        expect(result).toEqual({
            responseHandled: true,
        });
    });
});
