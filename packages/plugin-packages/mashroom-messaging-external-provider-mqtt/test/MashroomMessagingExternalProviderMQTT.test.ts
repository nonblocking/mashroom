import MashroomMessagingExternalProviderMQTT from '../src/provider/MashroomMessagingExternalProviderMQTT';

const mockSubscribe = jest.fn();
const mockPublish = jest.fn();
const mockOn = jest.fn();

jest.mock('mqtt', () => ({
    connect: () => ({
        subscribe: mockSubscribe,
        publish: mockPublish,
        on: mockOn,
    }),
}));

const loggerFactory: any = () => console;

describe('MashroomMessagingExternalProviderAMQP', () => {

    beforeEach(() => {
        mockSubscribe.mockReset();
        mockPublish.mockReset();
        mockOn.mockReset();
    });

    it('listens for messages from the external broker', async () => {
        const provider = new MashroomMessagingExternalProviderMQTT('mashroom', '', 4, 1, '', '', false, loggerFactory);

        provider.start();

        expect(mockSubscribe.mock.calls.length).toBe(1);
        expect(mockSubscribe.mock.calls[0][0]).toBe('mashroom/#');
        expect(mockSubscribe.mock.calls[0][1]).toEqual(  {
            qos: 1
        });
    });

    it('forwards external messages to the internal broker', async () => {
        const provider = new MashroomMessagingExternalProviderMQTT('mashroom', '', 4, 1, '', '', false, loggerFactory);

        const mockListener = jest.fn();
        provider.addMessageListener(mockListener);

        provider.start();

        const onMessage = mockOn.mock.calls[0][1];
        onMessage('mashroom/topic1/test', '{ "foo": 2 }');

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
        const provider = new MashroomMessagingExternalProviderMQTT('mashroom', '', 4, 1, '', '', false, loggerFactory);

        provider.start();

        mockPublish.mockImplementation((topic, data, opts, cb) => {
           cb();
        });

        await provider.sendInternalMessage('user/admin/test', { x: 1 });

        expect(mockPublish.mock.calls.length).toBe(1);
        expect(mockPublish.mock.calls[0][0]).toBe('mashroom/user/admin/test');
        expect(mockPublish.mock.calls[0][1].toString('utf-8')).toBe('{"x":1}');
    });

    it('sends an external message', async () => {
        const provider = new MashroomMessagingExternalProviderMQTT('mashroom', '', 4, 1, '', '', false, loggerFactory);

        provider.start();

        mockPublish.mockImplementation((topic, data, opts, cb) => {
            cb();
        });

        await provider.sendExternalMessage('external1/test', { y: 1 });

        expect(mockPublish.mock.calls.length).toBe(1);
        expect(mockPublish.mock.calls[0][0]).toBe('external1/test');
        expect(mockPublish.mock.calls[0][1].toString('utf-8')).toBe('{"y":1}');
    });

});

