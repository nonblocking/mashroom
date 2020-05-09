
import context from '../context/global_context';

import MashroomStorageService from './MashroomStorageService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const providerName = pluginConfig.provider;

    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MashroomStorageService(providerName, context.pluginRegistry, pluginContext.loggerFactory);

    return {
        service,
    };
};

export default bootstrap;
