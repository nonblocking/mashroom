
import PM2MetricExporter from './PM2MetricExporter';
import type { MashroomServicesPluginBootstrapFunction } from '@mashroom/mashroom/type-definitions';
import type {Config} from '../type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const exporter = new PM2MetricExporter(pluginConfig as Config, pluginContextHolder);
    exporter.start();
    pluginContextHolder.getPluginContext().services.core.pluginService.onUnloadOnce(pluginName, () => {
        exporter.stop();
    });
    return {};
};

export default bootstrap;
