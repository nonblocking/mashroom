
import {resolve, sep} from 'path';
import {readFileSync, existsSync} from 'fs';
import {readdir} from 'fs/promises';
import {EventEmitter} from 'events';
import chokidar from 'chokidar';
import {readonlyUtils} from '@mashroom/mashroom-utils';
import {getExternalPluginDefinitionFilePath} from '../../utils/plugin-utils';
import type {FSWatcher} from 'chokidar';
import type {MashroomLogger, MashroomLoggerFactory, MashroomServerConfig, MashroomPluginPackagePath, PluginPackageFolder} from '../../../type-definitions';
import type {MashroomPluginPackageScanner as MashroomPluginPackageScannerType, MashroomPluginPackageScannerEventName} from '../../../type-definitions/internal';

type DeferredUpdatesTimestamps = {
    [path: string]: number;
};

// Anymatch patterns
export const IGNORE_CHANGES_IN_PATHS: Array<string> = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/public/**'];

export const DEFAULT_DEFER_UPDATE_MS = 2000;

/**
 * The plugin scanner.
 * There should only be one per cluster - the other nodes will get the events per IPC.
 */
export default class MashroomPluginPackageScanner implements MashroomPluginPackageScannerType {

    private readonly _logger: MashroomLogger;
    private readonly _eventEmitter: EventEmitter;
    private readonly _deferUpdateMillis: number;
    private readonly _externalPluginConfigFileNames: Array<string>;
    private readonly _pluginPackageFolders: Array<PluginPackageFolder>;
    private readonly _foldersToWatch: Array<string>;
    private readonly _pluginPackagePaths: Array<MashroomPluginPackagePath>;
    private _watcher: FSWatcher | undefined;
    private _deferredUpdatesTimestamps: DeferredUpdatesTimestamps;
    private _deferredUpdatesTimer: NodeJS.Timeout | undefined;

    constructor(config: MashroomServerConfig, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.scanner');
        this._externalPluginConfigFileNames = config.externalPluginConfigFileNames;
        this._pluginPackageFolders = config.pluginPackageFolders.filter((folder) => {
           if (!existsSync(folder.path)) {
                this._logger.error(`Ignoring plugin package folder because it doesn't exist: ${folder.path}`);
                return false;
           }
           return true;
        });
        this._foldersToWatch = this._pluginPackageFolders.filter((f) => f.watch).map((f) => f.path);
        this._deferUpdateMillis = DEFAULT_DEFER_UPDATE_MS;
        this._deferredUpdatesTimestamps = {};
        this._eventEmitter = new EventEmitter();
        this._eventEmitter.setMaxListeners(0);
        this._pluginPackagePaths = [];
    }

    async start() {
        this._logger.info('Starting plugin package scanner');

        await this._initialScan();

        if (this._foldersToWatch.length > 0) {
            this._logger.debug('Start watching: ', this._foldersToWatch);
            this._watcher = chokidar.watch(this._foldersToWatch, {
                ignored: [/(^|[/\\])\../, ...IGNORE_CHANGES_IN_PATHS],
                persistent: true,
                ignoreInitial: true,
                followSymlinks: false,
                alwaysStat: false,
                depth: 10,
                ignorePermissionErrors: true,
                awaitWriteFinish: {
                    stabilityThreshold: 2000,
                    pollInterval: 100,
                },
            });

            this._watcher.on('all', this._processWatchEvent.bind(this));
            this._watcher.on('error', (error: Error) => {
                this._logger.error('Scanner error', error);
            });

            this._deferredUpdatesTimestamps = {};
            this._deferredUpdatesTimer = setInterval(this._deferredUpdates.bind(this), 2000);
        }
    }

    async stop() {
        if (this._foldersToWatch.length > 0) {
            this._logger.info('Stopping plugin package scanner');
            if (this._watcher) {
                await this._watcher.close();
                this._watcher = undefined;
            }
            if (this._deferredUpdatesTimer) {
                clearInterval(this._deferredUpdatesTimer);
                this._deferredUpdatesTimer = undefined;
            }
        }
    }

    on(eventName: MashroomPluginPackageScannerEventName, listener: (event: string) => void) {
        this._eventEmitter.on(eventName, listener);
    }

    removeListener(eventName: MashroomPluginPackageScannerEventName, listener: (event: string) => void): void {
        this._eventEmitter.removeListener(eventName, listener);
    }

    get pluginPackageFolders(): Readonly<Array<string>> {
        return readonlyUtils.cloneAndFreezeArray(this._pluginPackageFolders.map((f) => f.path));
    }

    get pluginPackagePaths(): Readonly<Array<MashroomPluginPackagePath>> {
        return readonlyUtils.cloneAndFreezeArray(this._pluginPackagePaths);
    }

    private _processChange(pluginPackagePath: string) {
        this._logger.debug(`Change in plugin package folder: ${pluginPackagePath}`);

        let eventName: MashroomPluginPackageScannerEventName | null = null;
        const exists = this._pluginPackagePaths.indexOf(pluginPackagePath) !== -1;
        const mashroomPluginPackage = this._isMashroomPluginPackage(pluginPackagePath);
        if (exists) {
            eventName = !mashroomPluginPackage ? 'packageRemoved' : 'packageUpdated';
        } else if (mashroomPluginPackage) {
            eventName = 'packageAdded';
        }
        if (!eventName) {
            return;
        }

        switch (eventName) {
            case 'packageAdded': {
                this._pluginPackagePaths.push(pluginPackagePath);
                this._fireEvent(eventName, pluginPackagePath);
                break;
            }
            case 'packageRemoved': {
                const packageIndex = this._pluginPackagePaths.indexOf(pluginPackagePath);
                this._pluginPackagePaths.splice(packageIndex, 1);
                this._fireEvent(eventName, pluginPackagePath);
                break;
            }
            case 'packageUpdated': {
                if (this._deferUpdateMillis > 0) {
                    this._deferredUpdatesTimestamps[pluginPackagePath] = Date.now() + this._deferUpdateMillis;
                } else {
                    this._fireEvent(eventName, pluginPackagePath);
                }
                break;
            }
        }
    }

    private _fireEvent(eventName: MashroomPluginPackageScannerEventName, pluginPackagePath: string) {
        this._logger.info(`Event: ${eventName}: ${pluginPackagePath}`);
        this._eventEmitter.emit(eventName, pluginPackagePath);
    }

    private _deferredUpdates() {
        for (const path in this._deferredUpdatesTimestamps) {
            if (this._deferredUpdatesTimestamps.hasOwnProperty(path)) {
                const timestamp = this._deferredUpdatesTimestamps[path];
                if (timestamp < Date.now()) {
                    delete this._deferredUpdatesTimestamps[path];
                    this._fireEvent('packageUpdated', path);
                }
            }
        }
    }

    private _processWatchEvent(event: string, changePath: unknown) {
        if (typeof(changePath) !== 'string') {
            return;
        }

        const rootFolder = this._pluginPackageFolders.find((f) => changePath.startsWith(f.path));
        if (rootFolder) {
            const pathWithinRootFolder = changePath.substr(rootFolder.path.length + 1);
            if (existsSync(resolve(rootFolder.path, 'package.json'))) {
                // This package folder contains a single package
                this._processChange(rootFolder.path);
            } else {
                // Resolve the actual package that contains the changed file
                const pluginPackageName = pathWithinRootFolder.split(sep)[0];
                const pluginPackagePath = resolve(rootFolder.path, pluginPackageName);
                this._processChange(pluginPackagePath);
            }
        }
    }

    private async _initialScan() {
        await Promise.all(this._pluginPackageFolders.map(async (pluginPackagesFolder) => {
            if (existsSync(resolve(pluginPackagesFolder.path, 'package.json'))) {
                // This package folder contains a single package
                this._processChange(pluginPackagesFolder.path);
            } else {
                const folders = await readdir(pluginPackagesFolder.path);
                folders.forEach((folder) => {
                    if (!folder.startsWith('.')) {
                        const pluginPackagePath = resolve(pluginPackagesFolder.path, folder);
                        this._processChange(pluginPackagePath);
                    }
                });
            }
        }));
    }

    private _isMashroomPluginPackage(pluginPackagePath: string): boolean {
        const externalPluginConfigFile = getExternalPluginDefinitionFilePath(pluginPackagePath, this._externalPluginConfigFileNames);
        if (externalPluginConfigFile) {
            return true;
        }

        const packageFile = resolve(pluginPackagePath, 'package.json');
        if (existsSync(packageFile)) {
            try {
                const packageJson = JSON.parse(readFileSync(packageFile).toString());
                return packageJson.hasOwnProperty('mashroom');
            } catch (e) {
                this._logger.error('Error loading package.json', e);
            }
        }

        return false;
    }
}
