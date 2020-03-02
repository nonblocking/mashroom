
import {setConnectionUri} from './mongodb_client';
import MashroomStorageMongoDB from './MashroomStorageMongoDB';

import {MashroomStoragePluginBootstrapFunction} from '@mashroom/mashroom-storage/type-definitions';

const bootstrap: MashroomStoragePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const {connectionUri} = pluginConfig;

    setConnectionUri(connectionUri);

    return new MashroomStorageMongoDB(pluginContext.loggerFactory);
};

export default bootstrap;
