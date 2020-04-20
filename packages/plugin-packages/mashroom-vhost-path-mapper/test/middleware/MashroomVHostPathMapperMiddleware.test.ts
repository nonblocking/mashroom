
import MashroomVHostPathMapperMiddleware from '../../src/middleware/MashroomVHostPathMapperMiddleware';

import type {VHostDefinitions} from '../../type-definitions/internal';

describe('MashroomVHostPathMapperMiddleware', () => {

    const loggerFactory: any = () => console;
    const pluginContext = {
        loggerFactory,
    };

    it('does nothing if no vhosts defined', () => {
        const vhostDefinitions: VHostDefinitions = {};
        const middleware = new MashroomVHostPathMapperMiddleware(vhostDefinitions).middleware();

        const req: any = {
            hostname: 'localhost',
            headers: {},
            pluginContext,
        };
        const res: any = {};
        const next = jest.fn();

        middleware(req, res, next);

        expect(next.mock.calls.length).toBe(1);
    });

    it('maps the path if a vhost definition exists', () => {
        const vhostDefinitions: VHostDefinitions = {
            'my-company.com': {
                mapping: {
                    '/': '/portal/web'
                }
            }
        };
        const middleware = new MashroomVHostPathMapperMiddleware(vhostDefinitions).middleware();

        const req: any = {
            hostname: 'my-company.com',
            url: '/foo?x=2',
            headers: {},
            pluginContext,
        };
        const res: any = {
            location: jest.fn(),
        };
        const next = jest.fn();

        middleware(req, res, next);

        expect(req.url).toBe('/portal/web/foo?x=2');
        expect(next.mock.calls.length).toBe(1);
    });

    it('maps the redirect if a vhost definitions exists', () => {
        const vhostDefinitions: VHostDefinitions = {
            'my-company.com': {
                mapping: {
                    '/': '/portal/web'
                }
            }
        };
        const middleware = new MashroomVHostPathMapperMiddleware(vhostDefinitions).middleware();

        const req: any = {
            hostname: 'my-company.com',
            url: '/bar?y=1',
            headers: {},
            pluginContext,
        };
        const location = jest.fn();
        const res: any = {
            location,
        };
        const next = jest.fn();

        middleware(req, res, next);

        res.location('/portal/web/x/foo?x=4');

        expect(location.mock.calls.length).toBe(1);
        expect(location.mock.calls[0][0]).toBe('/x/foo?x=4');
    })

});



