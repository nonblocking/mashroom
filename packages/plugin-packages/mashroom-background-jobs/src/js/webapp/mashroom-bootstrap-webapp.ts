
import webapp from './webapp';

import type {
    MashroomWebAppPluginBootstrapFunction
} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig) => {

    return webapp;
};

export default bootstrap;
