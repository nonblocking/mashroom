
import context from '../context';
import {SCANNER_NAME} from '../scanner/KubernetesRemotePortalAppsPluginScanner';
import type {MashroomHealthProbeStatus, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';

let oneFullScanDone = false;

export default (pluginContextHolder: MashroomPluginContextHolder) => ({
    async check(): Promise<MashroomHealthProbeStatus> {
        if (!oneFullScanDone) {
            const pluginContext = pluginContextHolder.getPluginContext();
            const logger = pluginContext.loggerFactory('mashroom.portal.remoteAppRegistry');
            const pluginService = pluginContext.services.core.pluginService;
            const services = context.services;
            const pluginPackages = pluginService.getPotentialPluginPackagesByScanner(SCANNER_NAME);

            let done = true;

            if (!context.initialScanDone) {
                done = false;
            } else {
                for (const service of services) {
                    const pluginPackage = pluginPackages.find((p) => p.url.toString() === service.url.toString());
                    if (pluginPackage) {
                        if (!pluginPackage.processedOnce) {
                            done = false;
                            break;
                        }
                    } else {
                        logger.warn(`Found no registered package for Kubernetes service: ${service.url}`);
                    }
                }
            }

            if (done) {
                oneFullScanDone = true;
                return {
                    ready: true,
                };
            }
            return {
                ready: false,
                error: 'Initial Kubernetes Remote App scan in progress',
            };
        }

        return {
            ready: true,
        };
    }
});
