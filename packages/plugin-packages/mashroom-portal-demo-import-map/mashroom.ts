import type {MashroomPlugins} from '@mashroom/mashroom-json-schemas/type-definitions';

const sharedImportMap = {
    imports: {
        react: 'https://ga.system.jspm.io/npm:react@19.1.1/index.js',
        'react-dom': 'https://ga.system.jspm.io/npm:react-dom@19.1.1/index.js',
        'react-dom/client': 'https://ga.system.jspm.io/npm:react-dom@19.1.1/client.js',
        scheduler: 'https://ga.system.jspm.io/npm:scheduler@0.26.0/index.js',
        process: 'https://ga.system.jspm.io/npm:process@0.11.10/browser.js',
    },
};

const pluginDefinition: MashroomPlugins = {
    plugins: [
        {
            name: 'Mashroom Portal Demo Import Map 1',
            type: 'portal-app2',
            clientBootstrap: 'startApp',
            resources: {
                moduleSystem: 'SystemJS',
                importMap: sharedImportMap,
                js: [
                    'index1.js'
                ]
            },
            local: {
                resourcesRoot: './dist',
            },
            defaultConfig: {
                title: 'Demo Import Map App 1',
                description: {
                    en: 'A demo Microfrontend that shares external vendor modules via import map',
                    de: 'Ein Demo Microfrontend das externe Module via Import Map teilt'
                },
                category: 'Demo'
            }
        },
        {
            name: 'Mashroom Portal Demo Import Map 2',
            type: 'portal-app2',
            clientBootstrap: 'startApp',
            resources: {
                moduleSystem: 'SystemJS',
                importMap: sharedImportMap,
                js: [
                    'index2.js'
                ]
            },
            local: {
                resourcesRoot: './dist',
            },
            defaultConfig: {
                title: 'Demo Import Map App 2',
                description: {
                    en: 'A demo Microfrontend that shares external vendor modules via import map',
                    de: 'Ein Demo Microfrontend das externe Module via Import Map teilt'
                },
                category: 'Demo'
            }
        }
    ]
};

export default pluginDefinition;
