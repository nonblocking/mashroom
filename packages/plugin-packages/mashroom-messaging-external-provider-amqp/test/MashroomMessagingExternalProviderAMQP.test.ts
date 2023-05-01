import MashroomMessagingExternalProviderAMQP from '../src/provider/MashroomMessagingExternalProviderAMQP';

const mockOpenReceiver = jest.fn();
const mockOpenSender = jest.fn();

jest.mock('rhea', () => ({
    connect: () => ({
        open_receiver: mockOpenReceiver,
        open_sender: mockOpenSender,
        on: () => { /* ignore */ },
    }),
}));

const loggerFactory: any = () => console;

describe('MashroomMessagingExternalProviderAMQP', () => {

    beforeEach(() => {
        mockOpenReceiver.mockReset();
        mockOpenSender.mockReset();
    });

    it('listens for messages from the external broker', async () => {
        const provider = new MashroomMessagingExternalProviderAMQP('mashroom', '/topic/', '#', 'localhost', 5672, '', '', loggerFactory);

        const mockOn = jest.fn();
        mockOpenReceiver.mockReturnValue(({
            on: mockOn,
        }));

        provider.start();

        expect(mockOn.mock.calls.length).toBe(1);
        expect(mockOpenReceiver.mock.calls.length).toBe(1);
        expect(mockOpenReceiver.mock.calls[0]).toEqual([
            {
                autoaccept: false,
                source: {
                    address: '/topic/mashroom.#',
                    durable: 0,
                    expiry_policy: 'session-end'
                }
            }
        ]);
    });

    it('forwards external messages to the internal broker', async () => {
        const provider = new MashroomMessagingExternalProviderAMQP('mashroom', '/topic/', '#', 'localhost', 5672, '', '', loggerFactory);

        const mockListener = jest.fn();
        provider.addMessageListener(mockListener);

        const mockOn = jest.fn();
        mockOpenReceiver.mockReturnValue(({
            on: mockOn,
        }));

        provider.start();

        const onMessage = mockOn.mock.calls[0][1];
        onMessage({
            message: {
                subject: 'mashroom.topic1.test',
                body: '{ "foo": 2 }',
            }
        });

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
        const provider = new MashroomMessagingExternalProviderAMQP('mashroom', '/topic/', '#', 'localhost', 5672, '', '', loggerFactory);

        mockOpenReceiver.mockReturnValue(({
            on: jest.fn(),
        }));
        const mockSenderOn = jest.fn();
        const mockSend = jest.fn();
        mockOpenSender.mockReturnValue(({
            on: mockSenderOn,
            send: mockSend,
            close: jest.fn(),
        }));

        provider.start();

        provider.sendInternalMessage('user/admin/test', { x: 1 });

        // Sendable
        mockSenderOn.mock.calls[0][1]();

        expect(mockOpenSender.mock.calls.length).toBe(1);
        expect(mockOpenSender.mock.calls[0]).toEqual([
            {
                target: {
                    address: '/topic/mashroom.user.admin.test'
                }
            }
        ]);
        expect(mockSend.mock.calls.length).toBe(1);
        expect(mockSend.mock.calls[0]).toEqual([
            {
                body: '{"x":1}',
                subject: 'mashroom.user.admin.test'
            }
        ]);
    });

    it('sends an external message', async () => {
        const provider = new MashroomMessagingExternalProviderAMQP('mashroom', '/topic/', '#', 'localhost', 5672, '', '', loggerFactory);

        mockOpenReceiver.mockReturnValue(({
            on: jest.fn(),
        }));
        const mockSenderOn = jest.fn();
        const mockSend = jest.fn();
        mockOpenSender.mockReturnValue(({
            on: mockSenderOn,
            send: mockSend,
            close: jest.fn(),
        }));

        provider.start();

        provider.sendExternalMessage('external1/test', { y: 1 });

        // Sendable
        mockSenderOn.mock.calls[0][1]();

        expect(mockOpenSender.mock.calls.length).toBe(1);
        expect(mockOpenSender.mock.calls[0]).toEqual([
            {
                target: {
                    address: '/topic/external1.test'
                }
            }
        ]);
        expect(mockSend.mock.calls.length).toBe(1);
        expect(mockSend.mock.calls[0]).toEqual([
            {
                body: '{"y":1}',
                subject: 'external1.test'
            }
        ]);
    });

});

