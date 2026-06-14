import listregisteredPortalApps from '../../../src/tools/apps/list-registered-portal-apps';
import type {MashroomPlugin, MashroomPotentialPluginPackage} from '@mashroom/mashroom/type-definitions';

const plugin1: Partial<MashroomPlugin> = {
    name: 'App 1',
    type: 'portal-app2',
    config: {
        message: 'The actual message',
    },
    pluginDefinition: {
        name: 'App 1',
        type: 'portal-app2',
        defaultConfig: {
            title: 'Demo React App',
            description: {
                en: 'A simple React Microfrontend',
                de: 'Ein einfaches React Microfrontend'
            },
            category: 'Demo',
            appConfig: {
                message: 'This is simple React based Microfrontend that communicates with other Apps on the page via message bus',
                pingButtonLabel: 'Send Ping'
            }
        }
    },
    pluginPackage: {
        pluginPackageUrl: new URL('file://a-local-path'),
    } as any
};

const plugin2: Partial<MashroomPlugin> = {
    name: 'App 2 (Remote)',
    type: 'portal-app2',
    config: {
    },
    pluginDefinition: {
        name: 'App 2 (Remote)',
        type: 'portal-app2',
        defaultConfig: {
            title: 'Another Demo App',
            category: 'Demo',
            appConfig: {
                name: 'World',
            }
        }
    },
    pluginPackage: {
        pluginPackageUrl: new URL('http://foo.bar:1234'),
    } as any
};

const pluginPackage: Partial<MashroomPotentialPluginPackage> = {
    url: new URL('http://foo.bar:1234'),
    scannerName: 'Mashroom Remote Package Scanner Kubernetes',
};

describe('list-registered-portal-apps', () => {

    it('returns all registered Apps',  async () => {
        const context: any = {
            loggerFactory: () => console,
            services: {
                core: {
                    pluginService: {
                        getPlugins: () => {
                            return [plugin1, plugin2];
                        },
                        getPotentialPluginPackages: () => {
                            return [pluginPackage];
                        }
                    }
                },
                i18n: {
                    service: {
                        defaultLanguage: 'en',
                        availableLanguages: ['en', 'de'],
                    }
                }
            }
        };

        const result = await listregisteredPortalApps(context)();

        expect(result.content).toEqual([{
            type: 'text',
            text: `\n                    Registered Portal Apps (2):\n\n                    1. Name: App 1, Title: Demo React App, Description: A simple React Microfrontend (translations: de: Ein einfaches React Microfrontend), Category: Demo, Source: file://a-local-path/, Status: undefined, config: {"title":"Demo React App","description":{"en":"A simple React Microfrontend","de":"Ein einfaches React Microfrontend"},"category":"Demo","appConfig":{"message":"This is simple React based Microfrontend that communicates with other Apps on the page via message bus","pingButtonLabel":"Send Ping"},"message":"The actual message"}\n2. Name: App 2 (Remote), Title: Another Demo App, Description: , Category: Demo, Source: http://foo.bar:1234/ (Kubernetes), Status: undefined, config: {"title":"Another Demo App","category":"Demo","appConfig":{"name":"World"}}\n                `,
        }]);
    });
});
