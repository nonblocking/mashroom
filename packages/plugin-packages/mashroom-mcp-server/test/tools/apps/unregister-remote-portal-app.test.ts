import unregisterRemotePortalApp from '../../../src/tools/apps/unregister-remote-portal-app';
import type {MashroomPotentialPluginPackage} from '@mashroom/mashroom/type-definitions';

const pluginPackage: MashroomPotentialPluginPackage = {
    url: new URL('http://foo.bar:1234'),
    scannerName: 'Mashroom Remote Package Scanner Kubernetes',
    foundPlugins: ['My App 25'],
} as any;

describe('unregister-remote-portal-app', () => {

    it('unregisters a remote Portal App successfully',  async () => {
        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                core: {
                    pluginService: {
                        getPotentialPluginPackages: () => {
                            return [pluginPackage];
                        }
                    },
                },
                remotePackageScanner: {
                    service: {
                        removePackageUrl: (url: URL) => {
                        },
                    }
                }
            }
        };
        const req: any = { pluginContext };

        const result = await unregisterRemotePortalApp(req)({ url: 'http://foo.bar:1234/' });

        expect(result.content).toEqual([{
            type: 'text',
            text: `Success. The following Apps have been unregistered: My App 25`,
        }]);
    });
});
