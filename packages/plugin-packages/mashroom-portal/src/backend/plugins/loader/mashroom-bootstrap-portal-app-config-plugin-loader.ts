
import context from '../../context/global-portal-context';
import PortalAppConfigPluginLoader from './PortalAppConfigPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const portalAppConfigLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new PortalAppConfigPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default portalAppConfigLoaderBootstrap;
