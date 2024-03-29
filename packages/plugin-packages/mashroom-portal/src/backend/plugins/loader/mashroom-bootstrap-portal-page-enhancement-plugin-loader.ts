
import context from '../../context/global-portal-context';
import PortalPageEnhancementPluginLoader from './PortalPageEnhancementPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const portalPageEnhancementLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new PortalPageEnhancementPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default portalPageEnhancementLoaderBootstrap;
