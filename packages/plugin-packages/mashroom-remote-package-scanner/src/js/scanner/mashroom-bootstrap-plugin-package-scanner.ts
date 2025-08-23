
import {registerRemotePluginPackagesMetrics, unregisterRemotePluginPackagesMetrics} from '../metrics/metrics';
import healthProbe from '../health/health-probe';
import RemotePluginPackagesScanner from './RemotePluginPackagesScanner';
import type {MashroomPluginPackageScannerPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomPluginPackageScannerPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const { remotePackageUrls } = pluginConfig;
    const {services: {core: {pluginService, healthProbeService}}, serverConfig: {serverRootFolder}} = pluginContextHolder.getPluginContext();

    healthProbeService.registerProbe(pluginName, healthProbe(pluginContextHolder));
    registerRemotePluginPackagesMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        healthProbeService.unregisterProbe(pluginName);
        unregisterRemotePluginPackagesMetrics();
    });

    return new RemotePluginPackagesScanner(remotePackageUrls, serverRootFolder, pluginContextHolder);
};

export default bootstrap;
