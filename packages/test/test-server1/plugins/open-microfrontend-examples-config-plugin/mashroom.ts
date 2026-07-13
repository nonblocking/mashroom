import type {MashroomPlugins} from '@mashroom/mashroom-json-schemas/type-definitions';

const pluginDefinition: MashroomPlugins = {
    plugins: [
        {
            name: 'OpenMicrofrontends Examples Config Plugin',
            type: 'portal-app-config',
            bootstrap: './configPlugin.ts',
        },
    ]
}

export default pluginDefinition;
