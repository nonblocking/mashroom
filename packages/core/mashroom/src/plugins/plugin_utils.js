// @flow

import type {MashroomPlugin, MashroomPluginLoader, MashroomPluginContext} from '../../type-definitions';
import {deepAssign} from '@mashroom/mashroom-utils/lib/model_utils';

export const createPluginConfig = (plugin: MashroomPlugin, loader: MashroomPluginLoader, context: MashroomPluginContext) => {
    const minimumPluginConfig = loader.generateMinimumConfig(plugin);
    const configFromServerConfig = context.serverConfig.plugins[plugin.name] || {};
    return deepAssign({}, minimumPluginConfig, plugin.pluginDefinition.defaultConfig || {}, configFromServerConfig);
};
