
import context from '../context';
import DummyKubernetesConnector from '../k8s/DummyKubernetesConnector';
import KubernetesConnector from '../k8s/KubernetesConnector';
import ScanK8SPortalRemoteAppsBackgroundJob from './ScanK8SPortalRemoteAppsBackgroundJob';
import type {MashroomBackgroundJobPluginBootstrapFunction} from '@mashroom/mashroom-background-jobs/type-definitions';

const bootstrap: MashroomBackgroundJobPluginBootstrapFunction = (pluginName, pluginConfig, pluginContextHolder) => {
    const pluginContext = pluginContextHolder.getPluginContext();
    const {
        k8sNamespacesLabelSelector, k8sNamespaces, k8sServiceLabelSelector, serviceNameFilter,
        refreshIntervalSec, accessViaClusterIP,
    } = pluginConfig;

    context.namespaces = [...k8sNamespaces || []];
    context.serviceLabelSelector = k8sServiceLabelSelector;
    context.serviceNameFilter = serviceNameFilter;

    const kubernetesConnector = process.env.K8S_CONNECTOR_DUMMY ?
        new DummyKubernetesConnector() :
        process.env.K8S_CONNECTOR_LOCAL_CONFIG ?
            new KubernetesConnector(true) :
            new KubernetesConnector();

    const backgroundJob = new ScanK8SPortalRemoteAppsBackgroundJob(
        k8sNamespacesLabelSelector, k8sNamespaces,
        k8sServiceLabelSelector,serviceNameFilter,
        refreshIntervalSec, accessViaClusterIP,
        kubernetesConnector, pluginContext.loggerFactory);

    return backgroundJob.run.bind(backgroundJob);
};

export default bootstrap;
