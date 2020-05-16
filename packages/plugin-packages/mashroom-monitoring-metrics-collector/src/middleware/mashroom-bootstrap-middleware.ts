
import MashroomMonitoringRequestMetricsMiddleware from './MashroomMonitoringRequestMetricsMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const { path } = pluginConfig;

    const middleware = new MashroomMonitoringRequestMetricsMiddleware(path);

    return middleware.middleware();
};

export default bootstrap;
