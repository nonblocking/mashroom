
import context from '../../context/global_context';
import MashroomMemoryCacheProviderPluginLoader from './MashroomMemoryCacheProviderPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const sessionStoreLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new MashroomMemoryCacheProviderPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default sessionStoreLoaderBootstrap;
