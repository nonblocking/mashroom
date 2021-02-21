
import context from '../../context/global_context';
import MashroomBackgroundJobPluginLoader from './MashroomBackgroundJobPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';
import type {MashroomBackgroundJobService} from '../../../../type-definitions';

const securityProviderLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const backgroundJobServices: MashroomBackgroundJobService = pluginContext.services.backgroundJobs.service;

    return new MashroomBackgroundJobPluginLoader(context.pluginRegistry, backgroundJobServices, pluginContext.loggerFactory);
};

export default securityProviderLoaderBootstrap;
