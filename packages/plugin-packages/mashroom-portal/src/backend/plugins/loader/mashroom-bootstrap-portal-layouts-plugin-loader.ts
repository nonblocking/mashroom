
import context from '../../context/global-portal-context';
import PortalLayoutsPluginLoader from './PortalLayoutsPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const portalLayoutLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new PortalLayoutsPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default portalLayoutLoaderBootstrap;
