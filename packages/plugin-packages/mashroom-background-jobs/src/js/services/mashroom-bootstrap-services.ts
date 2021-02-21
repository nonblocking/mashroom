
import MashroomBackgroundJobService from './MashroomBackgroundJobService';
import {
    startExportBackgroundJobMetrics,
    stopExportBackgroundJobMetrics
} from '../metrics/background_jobs_metrics';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const service = new MashroomBackgroundJobService(pluginContextHolder);

    startExportBackgroundJobMetrics(service, pluginContextHolder);
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        stopExportBackgroundJobMetrics();
    });

    return {
        service,
    };
};

export default bootstrap;
