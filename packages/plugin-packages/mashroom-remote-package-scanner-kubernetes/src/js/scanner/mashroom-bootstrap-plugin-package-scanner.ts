
import {registerKubernetesRemotePluginPackagesMetrics, unregisterKubernetesRemotePluginPackagesMetrics} from '../metrics/metrics';
import healthProbe from '../health/health-probe';
import DummyKubernetesConnector from '../k8s/DummyKubernetesConnector';
import KubernetesConnector from '../k8s/KubernetesConnector';
import context from '../context';
import KubernetesRemotePluginPackagesScanner from './KubernetesRemotePluginPackagesScanner';
import type {MashroomPluginPackageScannerPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomPluginPackageScannerPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {services: {core: {pluginService, healthProbeService}}, loggerFactory} = pluginContextHolder.getPluginContext();
    const {
        namespaceLabelSelector, namespaces, serviceLabelSelector, serviceNameFilter,
    } = pluginConfig;

    context.namespaceLabelSelector = namespaceLabelSelector;
    context.serviceLabelSelector = serviceLabelSelector;
    context.serviceNameFilter = serviceNameFilter;

    healthProbeService.registerProbe(pluginName, healthProbe(pluginContextHolder));
    registerKubernetesRemotePluginPackagesMetrics(pluginContextHolder);

    pluginService.onUnloadOnce(pluginName, () => {
        healthProbeService.unregisterProbe(pluginName);
        unregisterKubernetesRemotePluginPackagesMetrics();
    });

    const kubernetesConnector = process.env.K8S_CONNECTOR_DUMMY ?
        new DummyKubernetesConnector() :
        process.env.K8S_CONNECTOR_LOCAL_CONFIG ?
            new KubernetesConnector(true, loggerFactory) :
            new KubernetesConnector(false, loggerFactory);

    return new KubernetesRemotePluginPackagesScanner(namespaceLabelSelector, namespaces,
        serviceLabelSelector, serviceNameFilter,
        kubernetesConnector, loggerFactory);
};

export default bootstrap;
