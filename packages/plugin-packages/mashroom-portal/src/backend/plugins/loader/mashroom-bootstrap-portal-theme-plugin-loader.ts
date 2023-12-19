
import context from '../../context/global-portal-context';
import PortalThemePluginLoader from './PortalThemePluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const portalThemeLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new PortalThemePluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default portalThemeLoaderBootstrap;
