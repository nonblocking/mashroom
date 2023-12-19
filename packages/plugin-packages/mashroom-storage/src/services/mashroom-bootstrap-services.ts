
import context from '../context/global-context';

import MashroomStorageService from './MashroomStorageService';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {provider, memoryCache} = pluginConfig;

    const service = new MashroomStorageService(provider, memoryCache, context.pluginRegistry, pluginContextHolder);

    return {
        service,
    };
};

export default bootstrap;
