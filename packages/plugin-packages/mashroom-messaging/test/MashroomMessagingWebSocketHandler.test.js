// @flow

import MashroomMessagingWebSocketHandler from '../src/services/MashroomMessagingWebSocketHandler';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';

import type {
    MashroomMessagingWebSocketPublishRequest,
    MashroomMessagingWebSocketSubscribeRequest,
    MashroomMessagingWebSocketUnsubscribeRequest
} from '../type-definitions';

describe('MashroomMessagingWebSocketHandler', () => {

    const mockSubscribe = jest.fn();
    const mockUnsubscribe = jest.fn();
    const mockPublish = jest.fn();

    const mockMessagingService: any = {
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        publish: mockPublish
    };

    let webSocketMessageHandler = null;
    let webSocketDisconnectHandler = null;
    const mockSendMessage = jest.fn();

    const mockPluginContextHolder: any = {
        getPluginContext: () => ({
            loggerFactory: dummyLoggerFactory,
            services: {
                core: {
                    pluginService: {
                        onLoadedOnce: () => {},
                        onUnloadOnce: () => {}
                    }
                },
                websocket: {
                    service: {
                        sendMessage: mockSendMessage,
                        addMessageListener: (matcher, handler) => webSocketMessageHandler = handler,
                        addDisconnectListener: (handler) => webSocketDisconnectHandler = handler,
                    }
                },
            }
        })
    };

    beforeEach(() => {
        mockSubscribe.mockReset();
        mockUnsubscribe.mockReset();
        mockPublish.mockReset();
        mockSendMessage.mockReset();
    });

    it('processes subscribe requests', (done) => {
        const webSocketHandler = new MashroomMessagingWebSocketHandler(mockMessagingService, mockPluginContextHolder);
        webSocketHandler.startListeners();

        const client: any = {
            user: {
                username: 'maria'
            }
        };

        const request: MashroomMessagingWebSocketSubscribeRequest = {
            messageId: 'ABCD',
            command: 'subscribe',
            topic: 'foo/bar',
        };

        if (webSocketMessageHandler) {
            mockSubscribe.mockReturnValue(Promise.resolve());
            mockSendMessage.mockReturnValue(Promise.resolve());
            webSocketMessageHandler(request, client);

            setTimeout(() => {
                expect(mockSubscribe.mock.calls.length).toBe(1);
                expect(mockSubscribe.mock.calls[0][0]).toEqual({
                    username: 'maria'
                });
                expect(mockSubscribe.mock.calls[0][1]).toBe('foo/bar');

                expect(mockSendMessage.mock.calls.length).toBe(1);
                expect(mockSendMessage.mock.calls[0][0]).toEqual(client);
                expect(mockSendMessage.mock.calls[0][1]).toEqual({
                    messageId: 'ABCD',
                    success: true,
                });

                expect(webSocketHandler._clients.size).toBe(1);

                done();
            }, 100);
        }
    });

    it('sends an error message when subscription fails', (done) => {
        const webSocketHandler = new MashroomMessagingWebSocketHandler(mockMessagingService, mockPluginContextHolder);
        webSocketHandler.startListeners();

        const client: any = {
            user: {
                username: 'maria'
            }
        };

        const request: MashroomMessagingWebSocketSubscribeRequest = {
            messageId: 'ABCD',
            command: 'subscribe',
            topic: 'foo/bar',
        };

        if (webSocketMessageHandler) {
            mockSubscribe.mockReturnValue(Promise.reject('test'));
            mockSendMessage.mockReturnValue(Promise.resolve());
            webSocketMessageHandler(request, client);

            setTimeout(() => {
                expect(mockSendMessage.mock.calls.length).toBe(1);
                expect(mockSendMessage.mock.calls[0][0]).toEqual(client);
                expect(mockSendMessage.mock.calls[0][1]).toEqual({
                    messageId: 'ABCD',
                    error: true,
                    message: 'Subscribing to topic foo/bar failed',
                });

                done();
            }, 100);
        }
    });

    it('processes unsubscribe requests', (done) => {
        const webSocketHandler = new MashroomMessagingWebSocketHandler(mockMessagingService, mockPluginContextHolder);
        webSocketHandler.startListeners();

        const client: any = {
            user: {
                username: 'maria'
            }
        };

        webSocketHandler._clients.set(client, {
           subscriptions: [{
               topic: 'foo/xx',
               callback: () => {},
           }]
        });

        const request: MashroomMessagingWebSocketUnsubscribeRequest = {
            messageId: 'ABCD',
            command: 'unsubscribe',
            topic: 'foo/xx',
        };

        if (webSocketMessageHandler) {
            mockUnsubscribe.mockReturnValue(Promise.resolve());
            mockSendMessage.mockReturnValue(Promise.resolve());
            webSocketMessageHandler(request, client);

            setTimeout(() => {
                expect(mockUnsubscribe.mock.calls.length).toBe(1);
                expect(mockUnsubscribe.mock.calls[0][0]).toEqual('foo/xx');

                expect(mockSendMessage.mock.calls.length).toBe(1);
                expect(mockSendMessage.mock.calls[0][0]).toEqual(client);
                expect(mockSendMessage.mock.calls[0][1]).toEqual({
                    messageId: 'ABCD',
                    success: true,
                });

                expect(webSocketHandler._clients.size).toBe(1);

                done();
            }, 100);
        }
    });

    it('processes publish requests', (done) => {
        const webSocketHandler = new MashroomMessagingWebSocketHandler(mockMessagingService, mockPluginContextHolder);
        webSocketHandler.startListeners();

        const client: any = {
            user: {
                username: 'maria'
            }
        };

        const request: MashroomMessagingWebSocketPublishRequest = {
            messageId: 'ABCD',
            command: 'publish',
            topic: 'foo/xx',
            message: {
                test: '4',
            }
        };

        if (webSocketMessageHandler) {
            mockPublish.mockReturnValue(Promise.resolve());
            mockSendMessage.mockReturnValue(Promise.resolve());
            webSocketMessageHandler(request, client);

            setTimeout(() => {
                expect(mockPublish.mock.calls.length).toBe(1);
                expect(mockPublish.mock.calls[0][0]).toEqual({
                    username: 'maria'
                });
                expect(mockPublish.mock.calls[0][1]).toBe('foo/xx');
                expect(mockPublish.mock.calls[0][2]).toEqual({
                    test: '4',
                });

                expect(mockSendMessage.mock.calls.length).toBe(1);
                expect(mockSendMessage.mock.calls[0][0]).toEqual(client);
                expect(mockSendMessage.mock.calls[0][1]).toEqual({
                    messageId: 'ABCD',
                    success: true,
                });

                expect(webSocketHandler._clients.size).toBe(1);

                done();
            }, 100);
        }
    });

    it('sends an error message when publishing fails', (done) => {
        const webSocketHandler = new MashroomMessagingWebSocketHandler(mockMessagingService, mockPluginContextHolder);
        webSocketHandler.startListeners();

        const client: any = {
            user: {
                username: 'maria'
            }
        };

        const request: MashroomMessagingWebSocketPublishRequest = {
            messageId: 'ABCD',
            command: 'publish',
            topic: 'foo/xx',
            message: {
                test: '4',
            }
        };

        if (webSocketMessageHandler) {
            mockPublish.mockReturnValue(Promise.reject('test'));
            mockSendMessage.mockReturnValue(Promise.resolve());
            webSocketMessageHandler(request, client);

            setTimeout(() => {
                expect(mockSendMessage.mock.calls.length).toBe(1);
                expect(mockSendMessage.mock.calls[0][0]).toEqual(client);
                expect(mockSendMessage.mock.calls[0][1]).toEqual({
                    messageId: 'ABCD',
                    error: true,
                    message: 'Publishing message to topic foo/xx failed'
                });

                expect(webSocketHandler._clients.size).toBe(1);

                done();
            }, 100);
        }
    });

    it('unsubscribes when a client disconnects', (done) => {
        const webSocketHandler = new MashroomMessagingWebSocketHandler(mockMessagingService, mockPluginContextHolder);
        webSocketHandler.startListeners();

        const client: any = {
            user: {
                username: 'maria'
            }
        };

        webSocketHandler._clients.set(client, {
            subscriptions: [{
                topic: 'foo/xx',
                callback: () => {},
            }, {
                topic: 'bar/2',
                callback: () => {},
            }]
        });

        if (webSocketDisconnectHandler) {
            mockUnsubscribe.mockReturnValue(Promise.resolve());
            webSocketDisconnectHandler(client);

            setTimeout(() => {
                expect(mockUnsubscribe.mock.calls.length).toBe(2);
                expect(mockUnsubscribe.mock.calls[0][0]).toEqual('foo/xx');
                expect(mockUnsubscribe.mock.calls[1][0]).toEqual('bar/2');

                expect(webSocketHandler._clients.size).toBeFalsy();

                done();
            }, 100);
        }
    });

});
