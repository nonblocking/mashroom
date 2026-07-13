
import {loggingUtils} from '@mashroom/mashroom-utils';
import MashroomMessagingInternalService from '../src/services/MashroomMessagingInternalService';

describe('MashroomMessagingInternalService', () => {

    let onExternalMessageHandler: any = null;
    const sendExternalMessageMock = jest.fn();
    const sendInternalMessageMock = jest.fn();
    const mockMessagingProvider: any = {
        addMessageListener(handler: (topic: string, message: any) => void) {
            onExternalMessageHandler = handler;
        },
        sendExternalMessage: sendExternalMessageMock,
        sendInternalMessage: sendInternalMessageMock,
    };
    const mockRegistry: any = {
        findProvider(name: string) {
            if (name === 'mock') {
                return mockMessagingProvider;
            }
            return null;
        }
    };
    const aclAllowedMock = jest.fn();
    const mockAclChecker: any = {
        allowed: aclAllowedMock,
    };
    const mockPluginService: any = {
        onLoadedOnce: () => { /* Nothing to do */ },
        onUnloadOnce: () => { /* Nothing to do */ },
    };

    beforeEach(() => {
        sendExternalMessageMock.mockReset();
        sendInternalMessageMock.mockReset();
        aclAllowedMock.mockReturnValue(true);
    });

    it('does not allow to subscribe to all messages', async () => {
        const service = new MashroomMessagingInternalService(null, mockRegistry,
            [], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        const user: any = {};
        const dummyHandler = () => {
            // Nothing to do
        };

        await expect(service.subscribe(user, '#', dummyHandler)).rejects.toThrow('Invalid topic (must not start or end with /, must not start with a wildcard): #');
        // @ts-ignore
        expect(service._subscriptions.length).toBe(0);
        await expect(service.subscribe(user, '+', dummyHandler)).rejects.toThrow('Invalid topic (must not start or end with /, must not start with a wildcard): +');
        // @ts-ignore
        expect(service._subscriptions.length).toBe(0);

        await service.subscribe(user, 'test/#', dummyHandler);
        // @ts-ignore
        expect(service._subscriptions.length).toBe(1);
        await service.subscribe(user, 'mashroom/bar/+/x', dummyHandler);
        // @ts-ignore
        expect(service._subscriptions.length).toBe(2);
        await service.subscribe(user, 'test3/3/#', dummyHandler);
        // @ts-ignore
        expect(service._subscriptions.length).toBe(3);
        await service.subscribe(user, 'test3/#/1', dummyHandler);
        // @ts-ignore
        expect(service._subscriptions.length).toBe(4);
    });

    it('does not allow to subscribe to invalid topics', async () => {
        const service = new MashroomMessagingInternalService(null, mockRegistry,
            [], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        const user: any = {};
        const dummyHandler = () => {
            // Nothing to do
        };

        await expect(service.subscribe(user, '/test', dummyHandler)).rejects.toThrow('Invalid topic (must not start or end with /, must not start with a wildcard): /test');
        // @ts-ignore
        expect(service._subscriptions.length).toBe(0);
        await expect(service.subscribe(user, 'test/', dummyHandler)).rejects.toThrow('Invalid topic (must not start or end with /, must not start with a wildcard): test');
        // @ts-ignore
        expect(service._subscriptions.length).toBe(0);

        await service.subscribe(user, 'test/#', dummyHandler);
        // @ts-ignore
        expect(service._subscriptions.length).toBe(1);
    });

    it('does not allow to subscribe to external topics', async () => {
        const service = new MashroomMessagingInternalService(null, mockRegistry,
            ['external', 'what/ever'], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        const user: any = {};
        const dummyHandler = () => {
            // Nothing to do
        };

        await expect(service.subscribe(user, 'external/1', dummyHandler)).rejects.toThrow('It is not permitted to subscribe to external topics');
        // @ts-ignore
        expect(service._subscriptions.length).toBe(0);
        await expect(service.subscribe(user, 'what/ever', dummyHandler)).rejects.toThrow('It is not permitted to subscribe to external topics');
        // @ts-ignore
        expect(service._subscriptions.length).toBe(0);

        await service.subscribe(user, 'what/ever2', dummyHandler);
        // @ts-ignore
        expect(service._subscriptions.length).toBe(1);
        await service.subscribe(user, 'foo', dummyHandler);
        // @ts-ignore
        expect(service._subscriptions.length).toBe(2);
    });

    it('calculates the private topic prefix correctly', () => {
        const service = new MashroomMessagingInternalService(null, mockRegistry,
            [], 'user2', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        const user: any = {
            username: 'mel'
        };

        expect(service.getUserPrivateTopic(user)).toBe('user2/mel');
    });

    it('forwards internal messages to the subscribers', (done) => {
        const user1: any = {
            username: 'mel'
        };
        const user2: any = {
            username: 'john'
        };

        const service = new MashroomMessagingInternalService(null, mockRegistry,
            [], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        service.subscribe(user1, 'foo/#', (message, topic) => {
            expect(topic).toBe('foo/bar/1');
            expect(message).toEqual({
                test: 1,
            });
            done();
        });

        service.publish(user2, 'foo/bar/1', {
            test: 1,
        });
    });

    it('forwards messages to private user topics', (done) => {
        const user1: any = {
            username: 'mel'
        };
        const user2: any = {
            username: 'john'
        };

        const service = new MashroomMessagingInternalService(null, mockRegistry,
            [], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        service.subscribe(user1, 'user/mel/notification', (message, topic) => {
            expect(topic).toBe('user/mel/notification');
            expect(message).toEqual({
                notification: 'welcome',
            });
            done();
        });

        service.publish(user2, 'user/mel/notification', {
            notification: 'welcome',
        });
    });

    it('does not allow to subscribe to private topics of other users', async () => {
        const user1: any = {
            username: 'mel'
        };

        const service = new MashroomMessagingInternalService(null, mockRegistry,
            [], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        await expect(service.subscribe(user1, 'user/maria/notification', () => {  /* Nothing to do */ })).rejects.toThrow('User is not permitted to subscribe to user/maria/notification');
    });

    it('does not forward messages for other users even if one managed to subscribe', (done) => {
        const user1: any = {
            username: 'mel'
        };
        const user2: any = {
            username: 'john'
        };

        const service = new MashroomMessagingInternalService(null, mockRegistry,
            [], 'my/user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        service.subscribe(user1, 'my/#', (message) => {
            expect(message).toBeFalsy();
        });

        service.publish(user2, 'my/user/maria/notification', {
            notification: 'welcome',
        });

        setTimeout(() => {
            done();
        }, 1000);
    });

    it('does not allow to subscribe to a protected topic', async () => {
        const user1: any = {
            username: 'mel',
            roles: ['Role1']
        };

        aclAllowedMock.mockReturnValue(false);

        const service = new MashroomMessagingInternalService(null, mockRegistry,
            [], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        await expect(service.subscribe(user1, 'protected/topic', () => { /* Nothing to do */ })).rejects.toThrow('User is not permitted to subscribe to protected/topic');
    });

    it('does not forward messages protected by the ACL even if a user managed to subscribe', (done) => {
        const user1: any = {
            username: 'mel',
            roles: ['Role1']
        };
        const user2: any = {
            username: 'john'
        };


        const service = new MashroomMessagingInternalService(null, mockRegistry,
            [], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        service.subscribe(user1, 'protected/#', (message) => {
            expect(message).toBeFalsy();
        });

        aclAllowedMock.mockImplementation((topic, user) => {
            // Only john is allowed to access
            return user.username === 'john';
        });

        service.publish(user2, 'protected/topic', {
            notification: 'woohoo',
        });

        setTimeout(() => {
            done();
        }, 1000);
    });

    it('does not allow to publish to a protected topic', async () => {
        const user1: any = {
            username: 'mel',
            roles: ['Role1']
        };

        aclAllowedMock.mockReturnValue(false);

        const service = new MashroomMessagingInternalService(null, mockRegistry,
            [], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        await expect(service.publish(user1, 'protected/topic', {})).rejects.toThrow('User is not permitted to publish to protected/topic');
    });

    it('publishes internal messages to the external messaging provider if present', async () => {
        const user1: any = {
            username: 'mel',
            roles: ['Role1']
        };

        const service = new MashroomMessagingInternalService('mock', mockRegistry,
            [], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        await service.publish(user1, 'foo/bar', {});

        expect(sendInternalMessageMock.mock.calls.length).toBe(1);
        expect(sendInternalMessageMock.mock.calls[0][0]).toBe('foo/bar');
    });

    it('processes messages from an external messaging provider', (done) => {
        const user1: any = {
            username: 'mel'
        };

        const service = new MashroomMessagingInternalService('mock', mockRegistry,
            [], 'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);
        service.startListeners();

        service.subscribe(user1, 'foo/#', (message, topic) => {
            expect(topic).toBe('foo/bar/1');
            expect(message).toEqual({
                test: 1,
            });
            done();
        }).then(() => {
            if (onExternalMessageHandler) {
                onExternalMessageHandler('foo/bar/1', {
                    test: 1,
                });
            }
        });
    });

    it('forwards messages to an external messaging provider', async () => {
        const user1: any = {
            username: 'mel'
        };

        const service = new MashroomMessagingInternalService('mock', mockRegistry,
            ['external1', 'external2/foo'],
            'user', false, mockAclChecker, mockPluginService, loggingUtils.dummyLoggerFactory);

        await service.publish(user1, 'external2/foo/bar', {
            test2: true
        });

        expect(sendExternalMessageMock.mock.calls.length).toBe(1);
        expect(sendExternalMessageMock.mock.calls[0][0]).toBe('external2/foo/bar');
        expect(sendExternalMessageMock.mock.calls[0][1]).toEqual({
            test2: true
        });
    });
});
