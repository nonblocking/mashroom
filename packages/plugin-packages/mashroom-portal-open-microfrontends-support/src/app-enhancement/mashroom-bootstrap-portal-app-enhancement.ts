import MashroomOpenMicrofrontendsMashroomPortalAppEnhancementPlugin from './MashroomOpenMicrofrontendsMashroomPortalAppEnhancementPlugin';
import type {MashroomPortalAppEnhancementPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppEnhancementPluginBootstrapFunction = (pluginName, pluginConfig, pluginContextHolder) => {
    const {loggerFactory} = pluginContextHolder.getPluginContext();
    return new MashroomOpenMicrofrontendsMashroomPortalAppEnhancementPlugin(loggerFactory);
};

export default bootstrap;
