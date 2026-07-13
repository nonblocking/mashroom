import registerRemotePortalApp from '../../../src/tools/apps/register-remote-portal-app';
import type {MashroomPotentialPluginPackage} from '@mashroom/mashroom/type-definitions';

const pluginPackage: MashroomPotentialPluginPackage = {
    url: new URL('http://foo.bar:1234'),
    scannerName: 'Mashroom Remote Package Scanner Kubernetes',
    foundPlugins: ['My App 25'],
} as any;

describe('register-remote-portal-app', () => {

    it('registers a new remote Portal App without success',  async () => {
        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                core: {
                    pluginService: {
                        getPotentialPluginPackages: () => {
                            return [];
                        }
                    },
                },
                remotePackageScanner: {
                    service: {
                        addOrUpdatePackageUrl: (url: URL) => {
                        },
                    }
                }
            }
        };
        const req: any = { pluginContext };

        const result = await registerRemotePortalApp(req)({ url: 'http://foo.bar:1234/', waitForSec: 2 });

        expect(result.content).toEqual([{
            type: 'text',
            text: `Error: No new Apps registered on URL http://foo.bar:1234/ after 2 seconds!`,
        }]);
    });

    it('registers a new remote Portal App with success',  async () => {
        const potentialPluginPackages: Array<MashroomPotentialPluginPackage> = [];

        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                core: {
                    pluginService: {
                        getPotentialPluginPackages: () => {
                            return potentialPluginPackages;
                        }
                    },
                },
                remotePackageScanner: {
                    service: {
                        addOrUpdatePackageUrl: (url: URL) => {
                        },
                    }
                }
            }
        };
        const req: any = { pluginContext };

        const resultPromise = registerRemotePortalApp(req)({ url: 'http://foo.bar:1234/', waitForSec: 3 });
        potentialPluginPackages.push(pluginPackage);
        const result = await resultPromise;

        expect(result.content).toEqual([{
            type: 'text',
            text: `Success. The following new Apps have been registered: My App 25`,
        }]);
    });
});
