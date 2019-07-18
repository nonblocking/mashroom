// @flow

import MashroomStorageFilestore from './MashroomStorageFilestore';

import type {MashroomStoragePluginBootstrapFunction} from '@mashroom/mashroom-storage/type-definitions';

const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const dataFolder = pluginConfig.dataFolder;
    const pluginContext = pluginContextHolder.getPluginContext();
    return new MashroomStorageFilestore(dataFolder, pluginContext.loggerFactory);
};

export default bootstrap;
