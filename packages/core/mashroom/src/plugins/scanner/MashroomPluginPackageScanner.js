// @flow

import path from 'path';
import fs from 'fs';
import EventEmitter from 'events';
import chokidar from 'chokidar';
import {promisify} from 'util';
import {cloneAndFreezeArray} from '@mashroom/mashroom-utils/lib/readonly_utils';

const readdir = promisify(fs.readdir);

// Anymatch patterns
export const IGNORE_CHANGES_IN_PATHS: Array<string> = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/public/**'];

export const DEFAULT_DEFER_UPDATE_MS = 2000;

import type {
    MashroomLogger, MashroomLoggerFactory, MashroomServerConfig, MashroomPluginPackagePath, PluginPackageFolder,
} from '../../../type-definitions';
import type {
    MashroomPluginPackageScanner as MashroomPluginPackageScannerType, MashroomPluginPackageScannerEventName,
} from '../../../type-definitions/internal';

type DeferredUpdatesTimestamps = {
    [string]: number
};

/**
 * The plugin scanner.
 * There should only be one per cluster - the other nodes will get the events per IPC.
 */
export default class MashroomPluginPackageScanner implements MashroomPluginPackageScannerType {

    _log: MashroomLogger;
    _eventEmitter: EventEmitter;
    _deferUpdateMillis: number;
    _serverRootFolder: string;
    _pluginPackageFolders: Array<PluginPackageFolder>;
    _foldersToWatch: Array<string>;
    _pluginPackagePaths: Array<MashroomPluginPackagePath>;
    _watcher: any;
    _deferredUpdatesTimestamps: DeferredUpdatesTimestamps;
    _deferredUpdatesTimer: any;

    constructor(config: MashroomServerConfig, loggerFactory: MashroomLoggerFactory) {
        this._log = loggerFactory('mashroom.plugins.scanner');
        this._serverRootFolder = config.serverRootFolder;
        this._pluginPackageFolders = config.pluginPackageFolders.filter((folder) => {
           if (!fs.existsSync(folder.path)) {
                this._log.error(`Ignoring plugin package folder because it doesn't exist: ${folder.path}`);
                return false;
           }
           return true;
        });
        this._foldersToWatch = this._pluginPackageFolders.filter((f) => f.watch).map((f) => f.path);

        this.deferUpdateMillis = DEFAULT_DEFER_UPDATE_MS;

        this._eventEmitter = new EventEmitter();
        this._eventEmitter.setMaxListeners(0);
        this._pluginPackagePaths = [];
    }

    async start() {
        this._log.info('Starting plugin package scanner');

        await this._initialScan();

        if (this._foldersToWatch.length > 0) {
            this._log.debug('Start watching: ', this._foldersToWatch);
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
            this._watcher.on('error', (error) => {
                this._log.error('Scanner error', error);
            });

            this._deferredUpdatesTimestamps = {};
            this._deferredUpdatesTimer = setInterval(this._deferredUpdates.bind(this), 2000);
        }
    }

    async stop() {
        if (this._foldersToWatch.length > 0) {
            this._log.info('Stopping plugin package scanner');
            if (this._watcher) {
                this._watcher.close();
                this._watcher = null;
            }
            if (this._deferredUpdatesTimer) {
                clearInterval(this._deferredUpdatesTimer);
                this._deferredUpdatesTimer = null;
            }
        }
    }

    on(eventName: MashroomPluginPackageScannerEventName, listener: string => void) {
        this._eventEmitter.on(eventName, listener);
    }

    removeListener(eventName: MashroomPluginPackageScannerEventName, listener: string => void): void {
        this._eventEmitter.removeListener(eventName, listener);
    }

    get deferUpdateMillis(): number {
        return this._deferUpdateMillis;
    }

    set deferUpdateMillis(deferUpdateMillis: number) {
        this._deferUpdateMillis = deferUpdateMillis;
    }

    get pluginPackageFolders(): Array<string> {
        return cloneAndFreezeArray(this._pluginPackageFolders.map((f) => f.path));
    }

    get pluginPackagePaths(): Array<MashroomPluginPackagePath> {
        return cloneAndFreezeArray(this._pluginPackagePaths);
    }

    _processChange(pluginPackagePath: string) {
        this._log.debug(`Change in plugin package folder: ${pluginPackagePath}`);

        let eventName: ?MashroomPluginPackageScannerEventName = null;
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
                    this._deferredUpdatesTimestamps[pluginPackagePath] = Date.now() + this.deferUpdateMillis;
                } else {
                    this._fireEvent(eventName, pluginPackagePath);
                }
                break;
            }
        }
    }

    _fireEvent(eventName: MashroomPluginPackageScannerEventName, pluginPackagePath: string) {
        this._log.info(`Event: ${eventName}: ${pluginPackagePath}`);
        this._eventEmitter.emit(eventName, pluginPackagePath);
    }

    _deferredUpdates() {
        for (let path in this._deferredUpdatesTimestamps) {
            if (this._deferredUpdatesTimestamps.hasOwnProperty(path)) {
                const timestamp = this._deferredUpdatesTimestamps[path];
                if (timestamp < Date.now()) {
                    delete this._deferredUpdatesTimestamps[path];
                    this._fireEvent('packageUpdated', path);
                }
            }
        }
    }

    _processWatchEvent(event: string, changePath: string) {
        if (typeof(changePath) !== 'string') {
            return;
        }

        const rootFolder = this._pluginPackageFolders.find((f) => changePath.startsWith(f.path));
        if (rootFolder) {
            const pathWithinRootFolder = changePath.substr(rootFolder.path.length + 1);
            if (fs.existsSync(path.resolve(rootFolder.path, 'package.json'))) {
                // This package folder contains a single package
                this._processChange(rootFolder.path);
            } else {
                // Resolve the actual package that contains the changed file
                const pluginPackageName = pathWithinRootFolder.split(path.sep)[0];
                const pluginPackagePath = path.resolve(rootFolder.path, pluginPackageName);
                this._processChange(pluginPackagePath);
            }
        }
    }

    async _initialScan() {
        this._pluginPackageFolders.forEach(async (pluginPackagesFolder) => {
            if (fs.existsSync(path.resolve(pluginPackagesFolder.path, 'package.json'))) {
                // This package folder contains a single package
                this._processChange(pluginPackagesFolder.path);
            } else {
                const folders = await readdir(pluginPackagesFolder.path);
                folders.forEach((folder) => {
                    const pluginPackagePath = path.resolve(pluginPackagesFolder.path, folder);
                    this._processChange(pluginPackagePath);
                });
            }
        });
    }

    _isMashroomPluginPackage(pluginPackagePath: string): boolean {
        const packageFile = path.resolve(pluginPackagePath, 'package.json');

        if (fs.existsSync(packageFile)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageFile).toString());
                return packageJson.hasOwnProperty('mashroom');
            } catch (e) {
                this._log.error('Error loading package.json', e);
            }
        }

        return false;
    }
}
