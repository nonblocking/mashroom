// @flow

import context from '../../context/global_portal_context';
import PortalAppEnhancementPluginLoader from './PortalAppEnhancementPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const portalAppEnhancementLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new PortalAppEnhancementPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default portalAppEnhancementLoaderBootstrap;
