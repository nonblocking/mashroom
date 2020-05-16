
import setupDefaultMetrics from './setup_default_metrics';
import expressAppFactory from './webapp';

import type { MashroomWebAppPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomWebAppPluginBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const loggerFactory = contextHolder.getPluginContext().loggerFactory;
    const { enableGcStats } = pluginConfig;

    setupDefaultMetrics(enableGcStats, loggerFactory);

    return expressAppFactory(loggerFactory);
};

export default bootstrap;
