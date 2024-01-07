
import {startExport, stopExport} from './pm2-metric-exporter';
import {startPM2Connector, stopPM2Connector} from './pm2-cluster-connector';

import type { MashroomServicesPluginBootstrapFunction } from '@mashroom/mashroom/type-definitions';
import type {Config} from '../type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    startExport(pluginConfig as Config, pluginContextHolder);
    startPM2Connector(pluginContextHolder.getPluginContext());
    pluginContextHolder.getPluginContext().services.core.pluginService.onUnloadOnce(pluginName, () => {
        stopExport();
        stopPM2Connector();
    });
    return {};
};

export default bootstrap;
