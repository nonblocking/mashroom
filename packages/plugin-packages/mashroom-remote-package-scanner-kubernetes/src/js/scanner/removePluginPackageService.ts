import context from '../context';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {KubernetesService} from '../types';

export default (service: KubernetesService, logger: MashroomLogger) => {
    context.services = context.services.filter((s) => s.uid !== service.uid);
    if (service.url) {
        context.scannerCallback?.removePackageURL(service.url);
    }
    logger.info(`Kubernetes service with remote plugin package removed: ${service.name}`);
};
