
import {registerRemoteAppMetrics, unregisterRemoteAppMetrics} from '../metrics/metrics';
import healthProbe from '../health/health-probe';
import KubernetesRemotePortalAppsPluginScanner from './KubernetesRemotePortalAppsPluginScanner';
import type {MashroomPluginPackageScannerPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomPluginPackageScannerPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {services: {core: {pluginService, healthProbeService}}} = pluginContextHolder.getPluginContext();

    healthProbeService.registerProbe(pluginName, healthProbe(pluginContextHolder));
    registerRemoteAppMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        healthProbeService.unregisterProbe(pluginName);
        unregisterRemoteAppMetrics();
    });

    return new KubernetesRemotePortalAppsPluginScanner();
};

export default bootstrap;
