
import context from '../../context/global_context';
import MashroomHttpProxyInterceptorPluginLoader from './MashroomHttpProxyInterceptorPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const securityProviderLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new MashroomHttpProxyInterceptorPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default securityProviderLoaderBootstrap;
