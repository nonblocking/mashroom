
import getRemotePluginPackageEndpointStore from '../store/getRemotePluginPackageEndpointStore';
import {SCANNER_NAME} from '../scanner/RemotePluginPackagesScanner';
import context from '../context';
import type {MashroomHealthProbeStatus, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';

let oneFullScanDone = false;

export default (pluginContextHolder: MashroomPluginContextHolder) => ({
    async check(): Promise<MashroomHealthProbeStatus> {
        if (!oneFullScanDone) {
            const pluginContext = pluginContextHolder.getPluginContext();
            const logger = pluginContext.loggerFactory('mashroom.scanner.remotePackage');
            const pluginService = pluginContext.services.core.pluginService;
            const store = await getRemotePluginPackageEndpointStore(pluginContext);
            const {result: endpoints} = await store.find();
            const pluginPackages = pluginService.getPotentialPluginPackagesByScanner(SCANNER_NAME);

            let done = true;

            if (!context.initialScanDone) {
                done = false;
            } else {
                for (const endpoint of endpoints) {
                    if (endpoint.initialScan) {
                        continue;
                    }
                    const pluginPackage = pluginPackages.find((p) => p.url.toString() === new URL(endpoint.url).toString());
                    if (pluginPackage) {
                        if (!pluginPackage.processedOnce) {
                            done = false;
                            break;
                        }
                    } else {
                        logger.warn(`Found no registered package for endpoint: ${endpoint.url}`);
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
                error: 'Initial Remote Plugin Package scan in progress',
            };
        }

        return {
            ready: true,
        };
    }
});
