
import type {MashroomPlugins} from '@mashroom/mashroom-json-schemas/type-definitions';

const plugins: MashroomPlugins = {
    plugins: [
        {
            name: 'Test Webapp Plugin with TS config',
            type: 'web-app',
            bootstrap: './bootstrap.ts',
            defaultConfig: {
                path: '/test-webapp-ts-config',
                name: 'World'
            }
        }
    ]
}

export default plugins;
