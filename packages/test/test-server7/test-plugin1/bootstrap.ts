
import webapp from './webapp.ts';
import type {MashroomWebAppPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const plugin: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const {name} = pluginConfig;
    return webapp(name);
}

export default plugin;

