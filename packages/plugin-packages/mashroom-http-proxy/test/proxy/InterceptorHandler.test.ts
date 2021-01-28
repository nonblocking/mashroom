
// @ts-ignore
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import InterceptorHandler from '../../src/proxy/InterceptorHandler';

const interceptor1: any = {
    interceptRequest() {
        return {
            rewrittenTargetUri: 'https://one.com',
            addHeaders: {
                'X-Foo': 'bar',
            },
            addQueryParams: {
                'q': 'x'
            },
            removeHeaders: ['accept'],
        }
    }
}

const interceptor2: any = {
    interceptRequest(rewrittenTargetUri: string) {
        return {
            rewrittenTargetUri: `${rewrittenTargetUri  }/two`,
            addHeaders: {
                'X-Whatever': '123',
            },
            addQueryParams: {
                'foo': '1'
            },
        }
    }
}

const interceptor3: any = {
    interceptRequest() {
        return {
            removeHeaders: ['x'],
            removeQueryParams: ['x']
        }
    }
}

const interceptor4: any = {
    interceptRequest() {
        return {
            responseHandled: true,
        }
    }
}

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
        const result = await handler.processRequest(clientRequest, clientResponse, 'https://www.mashroom.com', { 'extra-header': '2' }, loggerFactory());

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

    it('processes the request interceptors with responseHandled', async () => {
        const clientRequest: any = {
        };
        const clientResponse: any = {
        };
        const handler = new InterceptorHandler(pluginRegistry2);
        const result = await handler.processRequest(clientRequest, clientResponse, 'https://www.mashroom.com', { 'extra-header': '2' }, loggerFactory());

        expect(result).toEqual({
            responseHandled: true,
        });
    });


});
