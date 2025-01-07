
import {loggingUtils} from '@mashroom/mashroom-utils';
import MashroomHttpProxyService from '../../src/proxy/MashroomHttpProxyService';

describe('MashroomHttpProxyService', () => {

    it('rejects requests with non whitelisted HTTP methods', async () => {
        const dummyProxy: any = {};
        const mockReq: any = {
            method: 'DELETE',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
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

    it('forwards valid requests', async () => {
        const dummyProxy: any = {
            forward: jest.fn(),
        };
        const mockReq: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
            }
        };
        const mockRes: any = {
        };

        const service = new MashroomHttpProxyService(['GET', 'POST'], dummyProxy);
        await service.forward(mockReq, mockRes, 'http://foobar.com');

        expect(dummyProxy.forward.mock.calls.length).toBe(1);
    });
});
