
import context from '../../context/global-portal-context';
import PortalPortalAppRegistryPluginLoader from './PortalPortalAppRegistryPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const pluginLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new PortalPortalAppRegistryPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default pluginLoaderBootstrap;
