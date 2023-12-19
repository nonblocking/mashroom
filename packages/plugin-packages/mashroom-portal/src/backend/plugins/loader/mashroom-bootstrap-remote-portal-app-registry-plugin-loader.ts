
import context from '../../context/global-portal-context';
import PortalRemotePortalAppRegistryPluginLoader from './PortalRemotePortalAppRegistryPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const pluginLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new PortalRemotePortalAppRegistryPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default pluginLoaderBootstrap;
