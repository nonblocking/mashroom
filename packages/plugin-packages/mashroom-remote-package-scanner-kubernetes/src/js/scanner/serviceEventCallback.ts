import {URL} from 'url';
import context from '../context';
import updatePluginPackageService from './updatePluginPackageService';
import removePluginPackageService from './removePluginPackageService';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {V1Service} from '@kubernetes/client-node';
import type {KubernetesWatchCallback} from '../types';

export default (serviceNameFilter: RegExp, logger: MashroomLogger): KubernetesWatchCallback<V1Service> => (event, service) => {
    if (!service.metadata) {
        return;
    }
    if (!service.metadata.name?.match(serviceNameFilter)) {
        return;
    }

    const {name, namespace} = service.metadata;

    if (event === 'ADDED' || event === 'MODIFIED') {
        logger.debug(`Kubernetes Service added or modified: ${service.metadata.name}, namespace: ${namespace}`);

        let kubernetesService = context.services.find((service) => service.uid === service.uid);
        if (!kubernetesService) {
            kubernetesService = {
                uid: service.metadata.uid ?? service.metadata.name,
                name,
                namespace,
                firstSeen: Date.now(),
                targetPort: undefined,
                url: undefined,
                selector: service.spec?.selector,
                runningPods: 0,
                imageVersion: undefined,
                lastModified: Date.now(),
                error: null,
            };
            context.services.push(kubernetesService);
        }

        const previousUrl = kubernetesService.url;

        const headlessService = service?.spec?.clusterIP?.toLowerCase() === 'none';
        const ports = service?.spec?.ports;
        const port = ports && ports.length > 0 ? ports[0].port : undefined;
        const targetPort = ports && ports.length > 0 ? String(ports[0].targetPort) : undefined;
        let url: URL | undefined;
        if (!headlessService) {
            let serviceUrl = `http://${name}`;
            if (namespace) {
                serviceUrl += `.${namespace}`;
            }
            if (port && port !== 80) {
                serviceUrl += `:${port}`;
            }
            url = new URL(serviceUrl);
        }

        kubernetesService.targetPort = targetPort;
        kubernetesService.url = url;
        kubernetesService.selector = service.spec?.selector;
        kubernetesService.lastModified = Date.now();
        if (headlessService) {
            kubernetesService.error = 'Headless Service';
        }

        updatePluginPackageService(kubernetesService, previousUrl, logger);

    } else if (event === 'DELETED') {
        logger.debug(`Kubernetes Service removed: ${service.metadata.name}, namespace: ${namespace}`);

        const kubernetesService = context.services.find((service) => service.uid === service.uid);
        if (kubernetesService) {
            removePluginPackageService(kubernetesService, logger);
        }
    }
};
