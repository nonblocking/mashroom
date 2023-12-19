
import context from '../../context/global-context';
import MashroomSecurityProviderPluginLoader from './MashroomSecurityProviderPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const securityProviderLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new MashroomSecurityProviderPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default securityProviderLoaderBootstrap;
