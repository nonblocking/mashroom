import {existsSync} from 'fs';
import {resolve, isAbsolute} from 'path';
import context from '../context';
import getRemotePortalAppEndpointStore from '../store/getRemotePortalAppEndpointStore';
import type {
    MashroomLogger,
    MashroomPluginContextHolder,
    MashroomPluginPackageScanner,
    MashroomPluginScannerCallback
} from '@mashroom/mashroom/type-definitions';

export const SCANNER_NAME = 'Remote Portal Apps Plugin Scanner';

export default class RemotePortalAppsPluginScanner implements MashroomPluginPackageScanner {

    private _logger: MashroomLogger;

    constructor(private _configFilePath: string, private _serverRootFolder: string, private _pluginContextHolder: MashroomPluginContextHolder) {
        this._logger = this._pluginContextHolder.getPluginContext().loggerFactory('mashroom.portal.remoteAppRegistry');
    }

    get name() {
        return SCANNER_NAME;
    }

    setCallback(callback: MashroomPluginScannerCallback) {
        context.scannerCallback = callback;
    }

    async start() {
        await this.initialScan();
    }

    async stop() {
        // Nothing to do
    }

    private async initialScan() {
        const urlsFromConfigFile = await this.getUrlsFromConfigFile();
        const store = await getRemotePortalAppEndpointStore(this._pluginContextHolder.getPluginContext());
        const {result: storedEndpoints} = await store.find();
        const allEndpoints = [...storedEndpoints];

        // Store all new URLs from the config file
        for (const url of urlsFromConfigFile) {
            if (storedEndpoints.find((e) => e.url === url)) {
                await store.updateOne({ url }, {
                    lastRefreshTimestamp: Date.now(),
                    initialScan: true,
                });
            } else {
                const inserted = await store.insertOne({
                    url,
                    lastRefreshTimestamp: Date.now(),
                    initialScan: true,
                });
                allEndpoints.push(inserted);
            }
        }

        // Register all URLs
        for (const endpoint of allEndpoints) {
            this._logger.info(`Registering remote Portal App endpoint: ${endpoint.url}`);
            context.scannerCallback?.addOrUpdatePackageURL(new URL(endpoint.url));
        }

        context.initialScanDone = true;
    }

    private async getUrlsFromConfigFile() {
        if (!this._configFilePath) {
            return [];
        }

        if (!isAbsolute(this._configFilePath)) {
            this._configFilePath = resolve(this._serverRootFolder, this._configFilePath);
        }

        if (existsSync(this._configFilePath)) {
            this._logger.info(`Loading remote Portal App URLs from: ${this._configFilePath}`);

            const remotePortalAppModule = require(this._configFilePath);
            const remotePortalAppData = remotePortalAppModule.default ?? remotePortalAppModule;
            return Array.isArray(remotePortalAppData) ? remotePortalAppData : (remotePortalAppData.remotePortalApps || []);
        } else {
            this._logger.warn(`Remote Portal App URLs config file not found: ${this._configFilePath}`);
        }

        return [];
    }

}
