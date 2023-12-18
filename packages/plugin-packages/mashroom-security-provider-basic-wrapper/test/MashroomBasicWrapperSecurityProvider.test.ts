

import {loggingUtils} from '@mashroom/mashroom-utils';

import MashroomBasicWrapperSecurityProvider from '../src/MashroomBasicWrapperSecurityProvider';

describe('MashroomBasicWrapperSecurityProvider', () => {

    it('allows authentication without user interaction if the authorization header is set', async () => {
        const provider = new MashroomBasicWrapperSecurityProvider('Test Provider', true, 'mashroom');

        const req1: any = {
            headers: {
            },
        };
        const req2: any = {
            headers: {
                authorization: 'Basic am9objpqb2huMTIz',
            },
        };

        expect(await provider.canAuthenticateWithoutUserInteraction(req1)).toBe(false);
        expect(await provider.canAuthenticateWithoutUserInteraction(req2)).toBe(true);
    });

    it('it uses the authorization header if present', async () => {
        const provider = new MashroomBasicWrapperSecurityProvider('Test Provider', true, 'mashroom');

        const mockLogin = jest.fn();
        const targetSecurityProvider: any = {
            login: mockLogin,
        };
        const req: any = {
            headers: {
                authorization: 'Basic am9objpqb2huMTIz',
            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            getSecurityProvider: () => targetSecurityProvider,
                        },
                    },
                },
            },
        };
        const res: any = {
        };

        mockLogin.mockReturnValue({ success: true });

        const result = await provider.authenticate(req, res);

        expect(result).toEqual({
            status: 'authenticated',
        });
        expect(mockLogin.mock.calls.length).toBe(1);
        expect(mockLogin.mock.calls[0][1]).toBe('john');
        expect(mockLogin.mock.calls[0][2]).toBe('john123');
    });

    it('it call authenticate() on the target provider if onlyPreemptive is true and no authorization header present', async () => {
        const provider = new MashroomBasicWrapperSecurityProvider('Test Provider', true, 'mashroom');

        const mockAuthenticate = jest.fn();
        const targetSecurityProvider: any = {
            authenticate: mockAuthenticate,
        };
        const req: any = {
            headers: {
            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            getSecurityProvider: () => targetSecurityProvider,
                        },
                    },
                },
            },
        };
        const res: any = {
        };

        await provider.authenticate(req, res);

        expect(mockAuthenticate.mock.calls.length).toBe(1);
    });

    it('it response with 401 if onlyPreemptive is false and no authorization header present', async () => {
        const provider = new MashroomBasicWrapperSecurityProvider('Test Provider', false, 'foo');

        const setHeaderMock = jest.fn();
        const sendStatusMock = jest.fn();
        const mockAuthenticate = jest.fn();
        const targetSecurityProvider: any = {
            authenticate: mockAuthenticate,
        };
        const req: any = {
            headers: {
            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            getSecurityProvider: () => targetSecurityProvider,
                        },
                    },
                },
            },
        };
        const res: any = {
            setHeader: setHeaderMock,
            sendStatus: sendStatusMock,
        };

        await provider.authenticate(req, res);

        expect(setHeaderMock.mock.calls.length).toBe(1);
        expect(setHeaderMock.mock.calls[0][0]).toBe('WWW-Authenticate');
        expect(setHeaderMock.mock.calls[0][1]).toBe('Basic realm="foo"');
        expect(sendStatusMock.mock.calls.length).toBe(1);
        expect(sendStatusMock.mock.calls[0][0]).toBe(401);
        expect(mockAuthenticate.mock.calls.length).toBe(0);
    });
});
