
import context from '../../src/context';
import MashroomVHostPathMapperService from '../../src/services/MashroomVHostPathMapperService';

describe('MashroomVHostPathMapperMiddleware', () => {

    const loggerFactory: any = () => console;
    const pluginContext = {
        loggerFactory,
    };

    it('maps the redirect to / if the location is the root path', () => {
        context.considerHttpHeaders = [];
        context.vhostDefinitions = {
            'my-company.com': {
                frontendBasePath: '/base',
                mapping: {
                    '/': '/portal/web'
                }
            }
        };
        const service = new MashroomVHostPathMapperService();

        const req: any = {
            hostname: 'my-company.com',
            url: '/whatever?y=1',
            headers: {},
            pluginContext,
        };

        const frontendUrl1 = service.getFrontendUrl(req, '/bar?x=2');
        const frontendUrl2 = service.getFrontendUrl(req, '/portal/web/foo');

        expect(frontendUrl1).toBe('/base/bar?x=2');
        expect(frontendUrl2).toBe('/base/foo');
    })

});



