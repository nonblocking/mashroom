
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomHttpProxyService from '../../src/proxy/MashroomHttpProxyService';

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
