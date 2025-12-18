import type {MashroomPlugins} from '@mashroom/mashroom-json-schemas/type-definitions';

const pluginDefinition: MashroomPlugins = {
    devModeBuildScript: 'build',
    plugins: [
        {
            name: 'Mashroom Portal Demo Pure JS App',
            type: 'portal-app2',
            clientBootstrap: 'startPureJsDemoApp',
            resources: {
                moduleSystem: 'ESM',
                js: [
                    'index.js'
                ],
                css: [
                    'style.css'
                ]
            },
            local: {
                resourcesRoot: './dist',
            },
            defaultConfig: {
                title: 'Demo Pure JS App',
                description: {
                    en: 'A pure JS Microfrontend that uses ES modules',
                    de: 'Ein pures JS Microfrontend das ES modules verwendet'
                },
                category: 'Demo',
                appConfig: {
                    message: 'This is pure JS Microfrontend that communicates with other Microfrontends on the page via message bus',
                    pingButtonLabel: 'Send Ping'
                }
            }
        }
    ]
};

export default pluginDefinition;
