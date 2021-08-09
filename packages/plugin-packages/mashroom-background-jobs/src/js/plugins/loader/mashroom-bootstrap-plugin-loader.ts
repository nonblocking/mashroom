
import context from '../../context/global_context';
import MashroomBackgroundJobPluginLoader from './MashroomBackgroundJobPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const securityProviderLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new MashroomBackgroundJobPluginLoader(context.pluginRegistry, pluginContextHolder);
};

export default securityProviderLoaderBootstrap;
