
import MashroomStorageFilestore from './MashroomStorageFilestore';

import type {MashroomStoragePluginBootstrapFunction} from '@mashroom/mashroom-storage/type-definitions';

const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { dataFolder, checkExternalChangePeriodMs, prettyPrintJson } = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();
    return new MashroomStorageFilestore(dataFolder, checkExternalChangePeriodMs, prettyPrintJson, pluginContext.loggerFactory);
};

export default bootstrap;
