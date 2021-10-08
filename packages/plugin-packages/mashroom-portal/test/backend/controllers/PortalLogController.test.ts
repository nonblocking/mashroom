
import PortalLogController from '../../../src/backend/controllers/PortalLogController';

describe('PortalLogController', () => {

    it('determines the source portal app correctly', async () => {

        let errorMessage = null;
        let context = {};
        const logger: any = {
            error: (...args: any) => errorMessage = args.join(' '),
            addContext: (c: any) => {
                context = {
                    ...context,
                    ...c
                };
                return logger;
            }
        };

        const req: any = {
            pluginContext: {
                loggerFactory: () => logger,
                services: {
                    security: {
                        service: {
                            getUser() {
                                return {
                                    username: 'admin',
                                    roles: ['Administrator'],
                                };
                            }
                        }
                    }
                }
            },
            connection: {
                remoteAddress: '127.0.0.1'
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
            },
            body: [{
                level: 'error',
                message: 'This is the error message',
                path: '/test',
                portalAppName: 'App2'
            }]
        };

        const res: any = {
            end: () => { /* nothing to do */ },
        };

        const pluginRegistry: any = {
            portalApps: [
                {name: 'App1', version: '1.0.1'},
                {name: 'App2', version: '2.2.4'},
            ]
        };

        const controller = new PortalLogController(pluginRegistry);
        await controller.log(req, res);

        expect(errorMessage).toBe('This is the error message [Page: /test] [App: App2 v2.2.4]');
        expect(context).toEqual({
            portalAppName: 'App2',
            portalAppVersion: '2.2.4'
        });
    });

});
