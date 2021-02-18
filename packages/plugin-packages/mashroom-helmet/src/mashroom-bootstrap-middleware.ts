
import helmet from 'helmet';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const { helmet: helmetConfig } = pluginConfig;
    return helmet(helmetConfig);
};

export default bootstrap;
