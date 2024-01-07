
import {registerSessionMetrics, unregisterSessionMetrics} from '../metrics/session-metrics';
import MashroomSessionMiddleware from './MashroomSessionMiddleware';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const storeProvider = pluginConfig.provider;
    const options = {...pluginConfig.session};

    registerSessionMetrics(pluginContextHolder);
    pluginContextHolder.getPluginContext().services.core.pluginService.onUnloadOnce(pluginName, () => {
        unregisterSessionMetrics();
    });

    const middleware = new MashroomSessionMiddleware(storeProvider, options);
    return middleware.middleware();
};

export default bootstrap;
