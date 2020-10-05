
import MashroomStorageFilestore from './MashroomStorageFilestore';

import type {MashroomStoragePluginBootstrapFunction} from '@mashroom/mashroom-storage/type-definitions';

const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { dataFolder, checkExternalChangePeriodMs, prettyPrintJson } = pluginConfig;
    const { serverConfig, loggerFactory } = pluginContextHolder.getPluginContext();
    return new MashroomStorageFilestore(dataFolder, serverConfig.serverRootFolder, checkExternalChangePeriodMs, prettyPrintJson, loggerFactory);
};

export default bootstrap;
