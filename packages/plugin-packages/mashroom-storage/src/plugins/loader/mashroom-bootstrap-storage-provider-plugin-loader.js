// @flow

import context from '../../context/global_context';
import MashroomStorageProviderLoader from './MashroomStorageProviderLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const storageProviderLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new MashroomStorageProviderLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default storageProviderLoaderBootstrap;
