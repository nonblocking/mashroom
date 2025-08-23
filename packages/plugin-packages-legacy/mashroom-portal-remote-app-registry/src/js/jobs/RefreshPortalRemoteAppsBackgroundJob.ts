import {URL} from 'url';
import getRemotePortalAppEndpointStore from '../store/getRemotePortalAppEndpointStore';
import context from '../context';
import type {
    MashroomLogger,
    MashroomPluginContextHolder,
} from '@mashroom/mashroom/type-definitions';

export default class RefreshPortalRemoteAppsBackgroundJob {

    private readonly _logger: MashroomLogger;

    constructor(private _registrationRefreshIntervalSec: number, private _pluginContextHolder: MashroomPluginContextHolder) {
        const pluginContext = _pluginContextHolder.getPluginContext();
        this._logger = pluginContext.loggerFactory('mashroom.portal.remoteAppRegistry');
    }

    async run() {
        this._logger.info('Start refreshing remote Portal App endpoints');

        const store = await getRemotePortalAppEndpointStore(this._pluginContextHolder.getPluginContext());
        const {result: endpoints} = await store.find();

        for (const remotePortalAppEndpoint of endpoints) {
            if (Date.now() - remotePortalAppEndpoint.lastRefreshTimestamp > this._registrationRefreshIntervalSec * 1000) {
                context.scannerCallback?.addOrUpdatePackageURL(new URL(remotePortalAppEndpoint.url));
                const updatedRemotePortalAppEndpoint = {
                    ...remotePortalAppEndpoint,
                    lastRefreshTimestamp: Date.now(),
                };
                await store.updateOne({ url: remotePortalAppEndpoint.url }, updatedRemotePortalAppEndpoint);
            }
        }
    }

}
