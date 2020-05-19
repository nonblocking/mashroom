
import MashroomSessionMiddleware from './MashroomSessionMiddleware';
import {startExportSessionMetrics, stopExportSessionMetrics} from '../metrics/session_metrics';

import type {MashroomMiddlewarePluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomMiddlewarePluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const storeProvider = pluginConfig.provider;
    const options = {...pluginConfig.session};

    startExportSessionMetrics(pluginContextHolder);
    pluginContextHolder.getPluginContext().services.core.pluginService.onUnloadOnce(pluginName, () => {
        stopExportSessionMetrics();
    });

    const middleware = new MashroomSessionMiddleware(storeProvider, options);
    return middleware.middleware();
};

export default bootstrap;
