
import type {MashroomPlugins} from '@mashroom/mashroom-json-schemas/type-definitions';

const pluginDefinition: MashroomPlugins = {
    plugins: [
        {
            name: 'Test Webapp Plugin written in TS and with a TS config',
            type: 'web-app',
            bootstrap: './bootstrap.ts',
            defaultConfig: {
                path: '/test-webapp-ts',
                name: 'World'
            }
        }
    ]
}

export default pluginDefinition;
