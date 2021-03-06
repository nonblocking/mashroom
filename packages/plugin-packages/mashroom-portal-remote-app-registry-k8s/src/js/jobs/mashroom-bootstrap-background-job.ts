
import context from '../context';
import DummyKubernetesConnector from '../k8s/DummyKubernetesConnector';
import KubernetesConnector from '../k8s/KubernetesConnector';
import ScanK8SPortalRemoteAppsBackgroundJob from './ScanK8SPortalRemoteAppsBackgroundJob';
import type {MashroomBackgroundJobPluginBootstrapFunction} from '@mashroom/mashroom-background-jobs/type-definitions';

const bootstrap: MashroomBackgroundJobPluginBootstrapFunction = (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const {k8sNamespaces, socketTimeoutSec, refreshIntervalSec, serviceNameFilter, accessViaClusterIP} = pluginConfig;

    context.serviceNameFilter = serviceNameFilter;

    const kubernetesConnector = process.env.DUMMY_K8S_CONNECTOR ? new DummyKubernetesConnector() : new KubernetesConnector();

    const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(
        k8sNamespaces, serviceNameFilter, socketTimeoutSec,
        refreshIntervalSec, accessViaClusterIP, kubernetesConnector, pluginContext.loggerFactory);

    // Run immediately
    backgroundJob.run();

    return backgroundJob.run.bind(backgroundJob);
};

export default bootstrap;
