// @flow

import context from '../../context/global_context';
import MashroomSessionStoreProviderPluginLoader from './MashroomSessionStoreProviderPluginLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const sessionStoreLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new MashroomSessionStoreProviderPluginLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default sessionStoreLoaderBootstrap;
