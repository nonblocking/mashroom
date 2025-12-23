import context from '../context';
import updatePluginPackageService from './updatePluginPackageService';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {V1Pod} from '@kubernetes/client-node';
import type {KubernetesContainer, KubernetesWatchCallback} from '../types';

export default (logger: MashroomLogger): KubernetesWatchCallback<V1Pod> => (event, pod) => {
    if (!pod.metadata || ! pod.metadata.uid) {
        return;
    }

    // IMPORTANT: we consider only running Pods
    if (pod.status?.phase !== 'Running') {
        event = 'DELETED';
    }

    if (event === 'ADDED' || event === 'MODIFIED') {
        logger.debug(`Kubernetes Pod added or modified: ${pod.metadata.name}, namespace: ${pod.metadata.namespace}`);

        let kubernetesPod = context.runningPods.find((existingPod) => existingPod.uid === pod.metadata?.uid);
        if (!kubernetesPod) {
            const containers: Array<KubernetesContainer> = [];
            if (pod.spec?.containers) {
                pod.spec.containers.forEach((container) => {
                    const containerPort = container.ports?.[0]?.containerPort;
                    const imageVersion = container.image ? container.image.split(':').pop() : undefined;
                    if (containerPort && imageVersion) {
                        containers.push({
                            containerPort: String(containerPort),
                            imageVersion,
                        });
                    }
                });
            }

            kubernetesPod = {
                uid: pod.metadata.uid,
                name: pod.metadata.name ?? pod.metadata.uid,
                namespace: pod.metadata.namespace,
                labels: {},
                containers,
                lastModified: Date.now(),
            };
            context.runningPods.push(kubernetesPod);
        }

        kubernetesPod.labels = pod.metadata.labels ?? {};
        kubernetesPod.lastModified = Date.now();

        // Update all services
        context.services.forEach((service) => updatePluginPackageService(service, undefined, logger));

    } else if (event === 'DELETED') {
        logger.debug(`Kubernetes Pod removed: ${pod.metadata.name}, namespace: ${pod.metadata.namespace}`);

        const kubernetesPod = context.runningPods.find((existingPid) => existingPid.uid === pod.metadata?.uid);
        if (kubernetesPod) {
            context.runningPods = context.runningPods.filter((p) => p.uid !== kubernetesPod.uid);

            // Update all services
            context.services.forEach((service) => updatePluginPackageService(service, undefined, logger));
        }
    }
};
