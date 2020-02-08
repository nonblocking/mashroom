import context from '../context';
import ScanK8SPortalRemoteAppsBackgroundJob from '../jobs/ScanK8SPortalRemoteAppsBackgroundJob';
import KubernetesConnector from '../k8s/KubernetesConnector';
import DummyKubernetesConnector from '../k8s/DummyKubernetesConnector';

import {MashroomRemotePortalAppRegistryBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomRemotePortalAppRegistryBootstrapFunction = async (pluginName, pluginConfig, contextHolder) => {
    const pluginContext = contextHolder.getPluginContext();
    const {k8sNamespaces, scanPeriodSec, refreshIntervalSec, serviceNameFilter, accessViaClusterIP} = pluginConfig;

    const kubernetesConnector = process.env.DUMMY_K8S_CONNECTOR ? new DummyKubernetesConnector() : new KubernetesConnector();

    const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(k8sNamespaces, serviceNameFilter, scanPeriodSec, refreshIntervalSec,
        accessViaClusterIP, kubernetesConnector, pluginContext.loggerFactory);
    backgroundJob.start();
    pluginContext.services.core.pluginService.onUnloadOnce(pluginName, () => {
        backgroundJob.stop();
    });

    context.serviceNameFilter = serviceNameFilter;

    return context.registry;
};

export default bootstrap;

