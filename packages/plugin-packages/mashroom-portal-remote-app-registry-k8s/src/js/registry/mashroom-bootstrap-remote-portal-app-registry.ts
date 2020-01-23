
import context from '../context';
import ScanK8SPortalRemoteAppsBackgroundJob from '../jobs/ScanK8SPortalRemoteAppsBackgroundJob';

import {MashroomRemotePortalAppRegistryBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomRemotePortalAppRegistryBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const pluginContext = contextHolder.getPluginContext();
    const {k8sNamespaces, scanPeriodSec, refreshIntervalSec, serviceNameFilter, accessViaClusterIP} = pluginConfig;


    const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(k8sNamespaces, serviceNameFilter, scanPeriodSec, refreshIntervalSec, accessViaClusterIP, pluginContext.loggerFactory);
    backgroundJob.start();
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        backgroundJob.stop();
    });

    return context.registry;
};

export default bootstrap;

