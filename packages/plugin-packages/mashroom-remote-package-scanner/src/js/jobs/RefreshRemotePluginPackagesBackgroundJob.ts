import {URL} from 'url';
import getRemotePluginPackageEndpointStore from '../store/getRemotePluginPackageEndpointStore';
import context from '../context';
import type {
    MashroomLogger,
    MashroomPluginContextHolder,
} from '@mashroom/mashroom/type-definitions';

export default class RefreshRemotePluginPackagesBackgroundJob {

    private readonly _logger: MashroomLogger;

    constructor(private _registrationRefreshIntervalSec: number, private _pluginContextHolder: MashroomPluginContextHolder) {
        const pluginContext = _pluginContextHolder.getPluginContext();
        this._logger = pluginContext.loggerFactory('mashroom.scanner.remotePackage');
    }

    async run() {
        this._logger.info('Start refreshing remote plugin packages');

        const store = await getRemotePluginPackageEndpointStore(this._pluginContextHolder.getPluginContext());
        const {result: endpoints} = await store.find();

        for (const endpoint of endpoints) {
            if (Date.now() - endpoint.lastRefreshTimestamp > this._registrationRefreshIntervalSec * 1000) {
                context.scannerCallback?.addOrUpdatePackageURL(new URL(endpoint.url));
                const updatedEndpoint = {
                    ...endpoint,
                    lastRefreshTimestamp: Date.now(),
                };
                await store.updateOne({ url: endpoint.url }, updatedEndpoint);
            }
        }
    }

}
