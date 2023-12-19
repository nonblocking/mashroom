
import context from '../../context/global-portal-context';
import PortalAppPluginLoader from './PortalAppPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const portalAppLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new PortalAppPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default portalAppLoaderBootstrap;
