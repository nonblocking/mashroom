
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomHttpProxyService from '../../src/proxy/MashroomHttpProxyService';

jest.mock('../../src/connection_pool', () => {
    const originalModule = jest.requireActual('../../src/connection_pool');
    return {
        __esModule: true, // Use it when dealing with esModules
        ...originalModule,
        getWaitingRequestsForHostHeader: () => 10,
    };
});

describe('MashroomHttpProxyService', () => {

    it('it rejects requests with non whitelisted HTTP methods', async () => {
        const dummyProxy: any = {};
        const mockReq: any = {
            method: 'DELETE',
            pluginContext: {
                loggerFactory,
            }
        };
        const mockRes: any = {
            status: null,
            sendStatus(stat: number) {
                this.status = stat;
            }
        };

        const service = new MashroomHttpProxyService(['GET', 'POST'], dummyProxy);
        await service.forward(mockReq, mockRes, 'http://foobar.com');

        expect(mockRes.status).toBe(405);
    });

    it('it rejects requests with invalid HTTP protocols', async () => {
        const dummyProxy: any = {};
        const mockReq: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory,
            }
        };
        const mockRes: any = {
            status: null,
            sendStatus(stat: number) {
                this.status = stat;
            }
        };

        const service = new MashroomHttpProxyService(['GET', 'POST'], dummyProxy);
        await expect(service.forward(mockReq, mockRes, 'file://what-ever.exe')).rejects.toThrowError('Cannot forward to file://what-ever.exe because the protocol is not supported (only HTTP and HTTPS is)');
    });

    it('it rejects requests with invalid WS protocols', async () => {
        const dummyProxy: any = {};
        const mockReq: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory,
            }
        };
        const socket: any = {};
        const buffer: any = {};

        const service = new MashroomHttpProxyService(['GET', 'POST'], dummyProxy);
        await expect(service.forwardWs(mockReq, socket, buffer, 'file://what-ever.exe')).rejects.toThrowError('Cannot forward to file://what-ever.exe because the protocol is not supported (only WS and WSS is)');
    });

    it('it rejects requests if too many are already waiting', async () => {
        const dummyProxy: any = {};
        const mockReq: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory,
            }
        };
        const mockRes: any = {
            status: null,
            sendStatus(stat: number) {
                this.status = stat;
            }
        };

        const service = new MashroomHttpProxyService(['GET', 'POST'], dummyProxy, 2);
        await service.forward(mockReq, mockRes, 'http://foobar.com');

        expect(mockRes.status).toBe(429);
    });

    it('forwards valid requests', async () => {
        const dummyProxy: any = {
            forward: jest.fn(),
        };
        const mockReq: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory,
            }
        };
        const mockRes: any = {
        };

        const service = new MashroomHttpProxyService(['GET', 'POST'], dummyProxy);
        await service.forward(mockReq, mockRes, 'http://foobar.com');

        expect(dummyProxy.forward.mock.calls.length).toBe(1);
    });
});
