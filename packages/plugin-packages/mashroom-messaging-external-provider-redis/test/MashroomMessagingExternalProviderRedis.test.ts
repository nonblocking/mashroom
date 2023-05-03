import MashroomMessagingExternalProviderRedis from '../src/provider/MashroomMessagingExternalProviderRedis';

const mockPSubscribe = jest.fn();
const mockPublish = jest.fn();
const mockOn = jest.fn();

jest.mock('../src/redis_client', () => ({
    getSubscriberClient: () => ({
        psubscribe: mockPSubscribe,
        on: mockOn,
    }),
    getPublisherClient: () => ({
        publish: mockPublish,
        on: mockOn,
    }),
}));

const loggerFactory: any = () => console;

describe('MashroomMessagingExternalProviderRedis', () => {

    beforeEach(() => {
        mockPSubscribe.mockReset();
        mockPublish.mockReset();
        mockOn.mockReset();
    });

    it('listens for messages from the external broker', async () => {
        const provider = new MashroomMessagingExternalProviderRedis('mashroom', loggerFactory);

        await provider.start();

        expect(mockPSubscribe.mock.calls.length).toBe(1);
        expect(mockPSubscribe.mock.calls[0][0]).toBe('mashroom/*');
        expect(mockOn.mock.calls.length).toBe(1);
    });

    it('forwards external messages to the internal broker', async () => {
        const provider = new MashroomMessagingExternalProviderRedis('mashroom', loggerFactory);

        const mockListener = jest.fn();
        provider.addMessageListener(mockListener);

        await provider.start();

        const onMessage = mockOn.mock.calls[0][1];
        onMessage('', 'mashroom/topic1/test', '{ "foo": 2 }');

        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(mockListener.mock.calls.length).toBe(1);
        expect(mockListener.mock.calls[0]).toEqual([
            'topic1/test',
            {
                foo: 2
            }
        ]);
    });

    it('sends an internal message', async () => {
        const provider = new MashroomMessagingExternalProviderRedis('mashroom', loggerFactory);

        await provider.start();

        mockPublish.mockImplementation((topic, data, cb) => {
           cb();
        });

        await provider.sendInternalMessage('user/admin/test', { x: 1 });

        expect(mockPublish.mock.calls.length).toBe(1);
        expect(mockPublish.mock.calls[0][0]).toBe('mashroom/user/admin/test');
        expect(mockPublish.mock.calls[0][1].toString('utf-8')).toBe('{"x":1}');
    });

    it('sends an external message', async () => {
        const provider = new MashroomMessagingExternalProviderRedis('mashroom', loggerFactory);

        await provider.start();

        mockPublish.mockImplementation((topic, data, cb) => {
            cb();
        });

        await provider.sendExternalMessage('external1/test', { y: 1 });

        expect(mockPublish.mock.calls.length).toBe(1);
        expect(mockPublish.mock.calls[0][0]).toBe('external1/test');
        expect(mockPublish.mock.calls[0][1].toString('utf-8')).toBe('{"y":1}');
    });

});

