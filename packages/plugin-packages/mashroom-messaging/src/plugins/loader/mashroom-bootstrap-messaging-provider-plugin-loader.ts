
import context from '../../context';
import MashroomExternalMessagingProviderPluginLoader from './MashroomExternalMessagingProviderPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const securityProviderLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new MashroomExternalMessagingProviderPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default securityProviderLoaderBootstrap;
