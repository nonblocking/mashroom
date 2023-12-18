
import {resolve} from 'path';
import {existsSync} from 'fs';
import {modelUtils, tsNodeUtils} from '@mashroom/mashroom-utils';

import type {MashroomPlugin, MashroomPluginLoader, MashroomPluginContext} from '../../type-definitions';

export const createPluginConfig = (plugin: MashroomPlugin, loader: MashroomPluginLoader, context: MashroomPluginContext) => {
    const minimumPluginConfig = loader.generateMinimumConfig(plugin);
    const configFromServerConfig = context.serverConfig.plugins && context.serverConfig.plugins[plugin.name] || {};
    return modelUtils.deepAssign({}, minimumPluginConfig, plugin.pluginDefinition.defaultConfig || {}, configFromServerConfig);
};

export const getExternalPluginDefinitionFilePath = (pluginPackagePath: string, externalPluginConfigFileNames: Array<string>): string | undefined => {
    const possiblePluginConfigFiles: Array<string> = [];
    externalPluginConfigFileNames.forEach((name) => {
        possiblePluginConfigFiles.push(resolve(pluginPackagePath, `${name}.json`));
        possiblePluginConfigFiles.push(resolve(pluginPackagePath, `${name}.js`));
        if (tsNodeUtils.withinTsNode()) {
            possiblePluginConfigFiles.push(resolve(pluginPackagePath, `${name}.ts`));
        }
    });
    const existingPluginConfigFiles = possiblePluginConfigFiles.filter((path) => existsSync(path));
    if (existingPluginConfigFiles.length === 0) {
        return;
    }

    return existingPluginConfigFiles[0];
};
