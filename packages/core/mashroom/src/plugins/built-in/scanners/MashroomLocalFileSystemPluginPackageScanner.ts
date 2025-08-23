
import {resolve, sep} from 'path';
import {pathToFileURL} from 'url';
import {existsSync} from 'fs';
import {readdir} from 'fs/promises';
import chokidar from 'chokidar';
import anymatch from 'anymatch';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPluginScannerCallback,
    MashroomServerConfig,
    PluginPackageFolder,
    MashroomPluginPackageScanner as MashroomPluginPackageScannerType,
} from '../../../../type-definitions';
import type {FSWatcher} from 'chokidar';

type DeferredUpdatesTimestamps = {
    [path: string]: number;
};

type FsEvent = 'added' | 'updated' | 'removed';

// Anymatch patterns
const IGNORE_CHANGES_IN_PATHS: Array<string> = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/temp/**',
    '**/tmp/**',
    '**/out/**',
    '**/public/**'
];

/**
 * The default plugin scanner
 */
export default class MashroomLocalFileSystemPluginPackageScanner implements MashroomPluginPackageScannerType {

    private readonly _logger: MashroomLogger;
    private readonly _pluginPackageFolders: Array<PluginPackageFolder>;
    private readonly _foldersToWatch: Array<string>;
    private readonly _pluginPackagePaths: Array<string>;
    private _watcher: FSWatcher | undefined;
    private _deferredUpdatesTimestamps: DeferredUpdatesTimestamps;
    private _deferredUpdatesTimer: NodeJS.Timeout | undefined;
    private _callback: MashroomPluginScannerCallback | undefined;

    constructor(config: MashroomServerConfig, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.scanner.fs');
        this._pluginPackageFolders = config.pluginPackageFolders.filter((folder) => {
           if (!existsSync(folder.path)) {
                this._logger.error(`Ignoring plugin package folder because it doesn't exist: ${folder.path}`);
                return false;
           }
           return true;
        });
        this._foldersToWatch = this._pluginPackageFolders.filter((f) => f.watch).map((f) => f.path);
        this._deferredUpdatesTimestamps = {};
        this._pluginPackagePaths = [];
    }

    get name() {
        return 'Default local file system scanner';
    }

    setCallback(callback: MashroomPluginScannerCallback) {
        this._callback = callback;
    }

    async start() {
        this._logger.info('Starting plugin package scanner');

        await this._initialScan();

        if (this._foldersToWatch.length > 0) {
            this._logger.debug('Start watching: ', this._foldersToWatch);

            this._watcher = chokidar.watch(this._foldersToWatch, {
                // Always use fs.watchFile to avoid EMFILE: too many open files
                usePolling: true,
                interval: 1000,
                binaryInterval: 1000,
                ignored: (path) => {
                    if (path.includes('/.') || path.includes(`\\.`)) {
                        return true;
                    }
                   return anymatch(IGNORE_CHANGES_IN_PATHS, path);
                },
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
            this._watcher.on('error', (error) => {
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

    private _processChange(pluginPackagePath: string, changePath: string) {
        this._logger.debug(`Change in plugin package folder: ${pluginPackagePath}. File: ${changePath}`);

        let eventName: FsEvent | undefined;
        const alreadyKnown = this._pluginPackagePaths.indexOf(pluginPackagePath) !== -1;
        const exists = existsSync(pluginPackagePath);
        if (exists) {
            if (alreadyKnown) {
                eventName = 'updated';
            } else  {
                eventName = 'added';
            }
        } else {
            eventName = 'removed';
        }

        if (!eventName) {
            return;
        }

        switch (eventName) {
            case 'added': {
                this._pluginPackagePaths.push(pluginPackagePath);
                this._fireEvent(eventName, pluginPackagePath);
                break;
            }
            case 'removed': {
                const packageIndex = this._pluginPackagePaths.indexOf(pluginPackagePath);
                this._pluginPackagePaths.splice(packageIndex, 1);
                this._fireEvent(eventName, pluginPackagePath);
                break;
            }
            case 'updated': {
                this._fireEvent(eventName, pluginPackagePath);
                break;
            }
        }
    }

    private _fireEvent(eventName: FsEvent, pluginPackagePath: string) {
        if (this._callback) {
            if (eventName === 'updated' || eventName === 'added') {
                this._callback.addOrUpdatePackageURL(pathToFileURL(pluginPackagePath));
            } else {
                this._callback.removePackageURL(pathToFileURL(pluginPackagePath));
            }
        }
    }

    private _deferredUpdates() {
        for (const path in this._deferredUpdatesTimestamps) {
            if (path in this._deferredUpdatesTimestamps) {
                const timestamp = this._deferredUpdatesTimestamps[path];
                if (timestamp < Date.now()) {
                    delete this._deferredUpdatesTimestamps[path];
                    this._fireEvent('updated', path);
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
            const pathWithinRootFolder = changePath.substring(rootFolder.path.length + 1);
            if (existsSync(resolve(rootFolder.path, 'package.json'))) {
                // This package folder contains a single package
                this._processChange(rootFolder.path, changePath);
            } else {
                // Resolve the actual package that contains the changed file
                const pluginPackageName = pathWithinRootFolder.split(sep)[0];
                const pluginPackagePath = resolve(rootFolder.path, pluginPackageName);
                this._processChange(pluginPackagePath, changePath);
            }
        }
    }

    private async _initialScan() {
        await Promise.all(this._pluginPackageFolders.map(async (pluginPackagesFolder) => {
            if (existsSync(resolve(pluginPackagesFolder.path, 'package.json'))) {
                // This package folder contains a single package
                this._processChange(pluginPackagesFolder.path, '.');
            } else {
                const folders = await readdir(pluginPackagesFolder.path);
                folders.forEach((folder) => {
                    if (!folder.startsWith('.')) {
                        const pluginPackagePath = resolve(pluginPackagesFolder.path, folder);
                        this._processChange(pluginPackagePath, '.');
                    }
                });
            }
        }));
    }
}
