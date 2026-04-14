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
                    en: 'A Microfrontend written in pure JavaScript and shipped as ES modules',
                    de: 'Ein Microfrontend in purem JavaScript geschrieben das als ES Module ausgeliefert wird'
                },
                category: 'Demo',
                appConfig: {
                    message: 'A Microfrontend written in pure JavaScript and shipped as ES modules that communicates with other Microfrontends on the page via message bus',
                    pingButtonLabel: 'Send Ping'
                }
            }
        }
    ]
};

export default pluginDefinition;
