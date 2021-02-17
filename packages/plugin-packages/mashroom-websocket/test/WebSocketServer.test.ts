
const SAMPLE_UUID_V4 = '4242-4242-4242-4242-4242';
jest.mock('uuid', () => ({
    v4: () => '4242-4242-4242-4242-4242',
}));

import os from 'os';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import WebSocketServer from '../src/backend/WebSocketServer';
import ReconnectMessageBufferStore from '../src/backend/webapp/ReconnectMessageBufferStore';

jest.useFakeTimers();
const reconnectMessageBufferStore = new ReconnectMessageBufferStore(os.tmpdir(), '.', dummyLoggerFactory);

describe('WebSocketServer', () => {

    it('creates a client', () => {
        const webSocketServer = new WebSocketServer(dummyLoggerFactory, reconnectMessageBufferStore);

        const webSocket: any = {
            on() { /* nothing to do */ },
            send: jest.fn(),
            ping: jest.fn(),
        };
        const user: any = {
            username: 'foo'
        };

        webSocketServer.createClient(webSocket, '/test', user, {});

        expect(webSocketServer.getClientCount()).toBe(1);
        expect(webSocketServer.getClientsOnPath('/test')).toEqual([{
            connectPath: '/test',
            user: {
                username: 'foo'
            },
            loggerContext: {},
            reconnecting: undefined,
            clientId: SAMPLE_UUID_V4,
            alive: true
        }]);
    });

    it('handles messages correctly', (done) => {
        const webSocketServer = new WebSocketServer(dummyLoggerFactory, reconnectMessageBufferStore);

        let onMessageHandler: any = null;
        const wsSend = jest.fn();
        const webSocket: any = {
            on(event: string, handler: (msg: string) => void) {
                if (event === 'message') {
                    onMessageHandler = handler;
                }
            },
            send: wsSend,
        };
        const user: any = {
            username: 'foo'
        };

        webSocketServer.createClient(webSocket, '/test', user, {});
        webSocketServer.addMessageListener((path, message) => path === '/test' && message.test === 1, (msg) => {
            expect(wsSend).toHaveBeenCalled();
            expect(msg).toEqual({
                test: 1
            });
            done();
        });

        if (onMessageHandler) {
            onMessageHandler('{ "test": 1 }');
        }
    });

    it('handles client disconnect correctly', (done) => {
        const webSocketServer = new WebSocketServer(dummyLoggerFactory, reconnectMessageBufferStore);

        let onCloseHandler: any = null;
        const wsSend = jest.fn();
        const webSocket: any = {
            on(event: string, handler: (msg: string) => void) {
                if (event === 'close') {
                    onCloseHandler = handler;
                }
            },
            send: wsSend,
            ping: jest.fn(),
        };
        const user: any = {
            username: 'foo'
        };

        webSocketServer.createClient(webSocket, '/test', user, {});
        webSocketServer.addDisconnectListener(() => {
            done();
        });

        if (onCloseHandler) {
            onCloseHandler();
            jest.advanceTimersByTime(5000);
        }
    });
});
