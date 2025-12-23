import semver from 'semver';
import context from '../context';
import type {URL} from 'url';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {KubernetesService} from '../types';

export default (service: KubernetesService, previousUrl: URL | undefined, logger: MashroomLogger) => {
    if (!service.url) {
        return;
    }

    const pods = context.runningPods.filter((pod) => {
        if (!service.selector || Object.keys(service.selector).length === 0) {
            return false;
        }
        return Object.keys(service.selector).every((key) => pod.labels[key] === service.selector![key]);
    });
    const containers = pods
        .map((pod) => pod.containers.find((c) => c.containerPort === service.targetPort))
        .filter((c) => !!c);

    if (pods.length === 0) {
        // No running pods found
        if (service.runningPods > 0) {
            context.scannerCallback?.removePackageURL(service.url);
            logger.info(`Remote plugin package removed because not running Pods found for Kubernetes Service: ${service.name}`);
        }

        service.runningPods = 0;
        service.imageVersion = undefined;
        service.error = 'No running Pods';

    } else {
        const urlChange = previousUrl && previousUrl.toString() !== service.url.toString();
        const highestImageVersion = containers.sort((p1, p2) => semver.gt(p1.imageVersion, p2.imageVersion) ? -1 : 1)[0].imageVersion;
        let updatePluginPackage = false;
        if (service.runningPods === 0) {
            updatePluginPackage = true;
            logger.info(`Remote plugin package updated because running Pods found for Kubernetes Service: ${service.name}`);
        } else if (service.imageVersion !== highestImageVersion) {
            updatePluginPackage = true;
            logger.info(`Remote plugin package updated because image version changed for Kubernetes Service: ${service.name}. Image version: ${service.imageVersion} -> ${highestImageVersion}`);
        } else if (urlChange) {
            updatePluginPackage = true;
            logger.info(`Remote plugin package updated because URL changed for Kubernetes Service: ${service.name}. URL: ${previousUrl} -> ${service.url}`);
        }

        if (updatePluginPackage) {
            if (urlChange) {
                context.scannerCallback?.removePackageURL(previousUrl);
            }
            context.scannerCallback?.addOrUpdatePackageURL(service.url, {
                packageName: service.name,
                packageVersion: highestImageVersion,
                ...service.annotations,
            });
            service.lastModified = Date.now();
        }

        service.runningPods = pods.length;
        service.imageVersion = highestImageVersion;
        service.error = null;
    }
};
