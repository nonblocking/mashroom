import {existsSync} from 'fs';
import {resolve, isAbsolute} from 'path';
import context from '../context';
import getRemotePluginPackageEndpointStore from '../store/getRemotePluginPackageEndpointStore';
import type {
    MashroomLogger,
    MashroomPluginContextHolder,
    MashroomPluginPackageScanner,
    MashroomPluginScannerCallback
} from '@mashroom/mashroom/type-definitions';

export const SCANNER_NAME = 'Remote Plugin Packages Scanner';

export default class RemotePluginPackagesScanner implements MashroomPluginPackageScanner {

    private _logger: MashroomLogger;

    constructor(private _configFilePath: string, private _serverRootFolder: string, private _pluginContextHolder: MashroomPluginContextHolder) {
        this._logger = this._pluginContextHolder.getPluginContext().loggerFactory('mashroom.scanner.remotePackage');
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
        const store = await getRemotePluginPackageEndpointStore(this._pluginContextHolder.getPluginContext());
        const {result: storedEndpoints} = await store.find();
        const allEndpoints = [...storedEndpoints];

        // Store all new URLs from the config file
        for (const rawUrl of urlsFromConfigFile) {
            let url;
            let protocol;
            try {
                const parsedUrl = new URL(rawUrl);
                url = parsedUrl.toString();
                protocol = parsedUrl.protocol;
            } catch (e) {
                this._logger.error(`Invalid URL in config file: ${rawUrl}`);
                continue;
            }
            if (protocol !== 'http:' && protocol !== 'https:') {
                this._logger.error(`Invalid URL protocol in config file: ${rawUrl}`);
                continue;
            }

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
            this._logger.info(`Registering remote plugin package: ${endpoint.url}`);
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
            this._logger.info(`Loading remote plugin package URLs from: ${this._configFilePath}`);

            const remotePluginPackagesUrlsModule = require(this._configFilePath);
            const remotePluginPackagesUrlsData = remotePluginPackagesUrlsModule.default ?? remotePluginPackagesUrlsModule;
            return Array.isArray(remotePluginPackagesUrlsData) ? remotePluginPackagesUrlsData : (remotePluginPackagesUrlsData.remotePackageUrls || []);
        } else {
            this._logger.warn(`Remote plugin package URLs config file not found: ${this._configFilePath}`);
        }

        return [];
    }

}
