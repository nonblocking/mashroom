
import {registerRemoteAppMetrics, unregisterRemoteAppMetrics} from '../metrics/metrics';
import healthProbe from '../health/health-probe';
import RemotePortalAppsPluginScanner from './RemotePortalAppsPluginScanner';
import type {MashroomPluginPackageScannerPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomPluginPackageScannerPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { remotePortalAppUrls } = pluginConfig;
    const {services: {core: {pluginService, healthProbeService}}, serverConfig: {serverRootFolder}} = pluginContextHolder.getPluginContext();

    healthProbeService.registerProbe(pluginName, healthProbe(pluginContextHolder));
    registerRemoteAppMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        healthProbeService.unregisterProbe(pluginName);
        unregisterRemoteAppMetrics();
    });

    return new RemotePortalAppsPluginScanner(remotePortalAppUrls, serverRootFolder, pluginContextHolder);
};

export default bootstrap;
