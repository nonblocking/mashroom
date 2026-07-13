import MashroomOpenMicrofrontendsPluginPackageDefinitionBuilder from './MashroomOpenMicrofrontendsPluginPackageDefinitionBuilder';
import type {MashroomPluginPackageDefinitionBuilderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomPluginPackageDefinitionBuilderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory} = pluginContextHolder.getPluginContext();
    return new MashroomOpenMicrofrontendsPluginPackageDefinitionBuilder(loggerFactory);
};

export default bootstrap;
