// @flow

import path from 'path';
import fs from 'fs';
import EventEmitter from 'events';
import {ensureDirSync} from 'fs-extra';
import {promisify} from 'util';
import stripAnsi from 'strip-ansi';
import NpmUtils from './NpmUtils';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const MAX_PARALLEL_BUILDS = 5;
const RETRY_RUNNING_BUILD_AFTER_MS = 60 * 1000;
const IGNORE_PATHS: Array<string> = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/public/**'];

import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomServerConfig,
} from '../../../type-definitions';
import type {
    MashroomPluginPackageBuilder as MashroomPluginPackageBuilderType,
    MashroomPluginPackageBuilderEventName,
    MashroomPluginPackageBuilderEvent,
} from '../../../type-definitions/internal';
import digestDirectory from 'lucy-dirsum';
import anymatch from 'anymatch';

type BuildQueueEntry = {
    pluginPackageName: string,
    pluginPackagePath: string,
    buildScript: ?string,
    lastSourceUpdateTimestamp: number
}

type BuildStatus = 'running' | 'success' | 'error';
type BuildInfo = {
    buildStart: number,
    buildEnd: ?number,
    buildStatus: BuildStatus,
    buildErrorMessage?: ?string,
    buildPackageChecksum?: string,
};


/**
 * Build service for plugin packages.
 * There should only be one per cluster - the other nodes will get the events per IPC.
 */
export default class MashroomPluginPackageBuilder implements MashroomPluginPackageBuilderType {

    _log: MashroomLogger;
    _buildDataFolder: string;
    _npmUtils: NpmUtils;
    _buildQueue: Array<BuildQueueEntry>;
    _buildSlots: Array<Promise<void>>;
    _eventEmitter: EventEmitter;
    _numberBuilds: number;
    _processingAllowed: boolean;

    constructor(config: MashroomServerConfig, loggerFactory: MashroomLoggerFactory) {
        this._buildDataFolder = path.resolve(config.tmpFolder, config.name, 'build-data');
        this._log = loggerFactory('mashroom.plugins.build');
        this._npmUtils = new NpmUtils(loggerFactory);
        this._eventEmitter = new EventEmitter();
        this._eventEmitter.setMaxListeners(0);

        this._buildQueue = [];
        this._buildSlots = [];

        this._log.info(`Build data folder: ${this._buildDataFolder}`);
        ensureDirSync(this._buildDataFolder);
        this._processingAllowed = true;
    }

    addToBuildQueue(pluginPackageName: string, pluginPackagePath: string, buildScript: ?string, lastSourceUpdateTimestamp: number = Date.now()) {
        if (!this._processingAllowed) {
            return;
        }

        this.removeFromBuildQueue(pluginPackageName);

        this._buildQueue.push({
            pluginPackageName,
            pluginPackagePath,
            buildScript,
            lastSourceUpdateTimestamp,
        });

        this._processBuildQueue();
    }

    removeFromBuildQueue(pluginPackageName: string) {
        const existingEntryIndex = this._buildQueue.findIndex((e) => e.pluginPackageName === pluginPackageName);
        if (existingEntryIndex > -1) {
            this._buildQueue.splice(existingEntryIndex, 1);
        }
    }

    stopProcessing() {
        this._processingAllowed = false;
    }

    on(eventName: MashroomPluginPackageBuilderEventName, listener: MashroomPluginPackageBuilderEvent => void) {
        this._eventEmitter.on(eventName, listener);
    }

    removeListener(eventName: MashroomPluginPackageBuilderEventName, listener: MashroomPluginPackageBuilderEvent => void): void {
        this._eventEmitter.removeListener(eventName, listener);
    }

    async _processBuildQueue() {
        if (this._buildSlots.length === MAX_PARALLEL_BUILDS) {
            this._log.debug(`Builds running: ${this._buildSlots.length}/${MAX_PARALLEL_BUILDS}`);
            return; // all slots are full
        }

        while (this._buildQueue.length > 0) {
            this._log.debug(`Builds running: ${this._buildSlots.length}/${MAX_PARALLEL_BUILDS}`);

            const availableWorkers = Math.max(0, MAX_PARALLEL_BUILDS - this._buildSlots.length);
            const buildCandidates = [...this._buildQueue].slice(0, availableWorkers);

            if (buildCandidates.length > 0) {
                this._log.debug(`Adding ${buildCandidates.length} out of ${this._buildQueue.length} pending build jobs.`);
                this._buildSlots.push(...buildCandidates.map(bc => this._processQueueEntry(bc)));
                const finishedIdx = await Promise.race(this._buildSlots.map((build, idx) => build.then(() => idx)));
                this._log.debug(`Build #${finishedIdx} out of ${this._buildSlots.length} pending jobs finished.`);
                this._buildSlots.splice(finishedIdx, 1);
            }
        }
    }

    async _getBuildChecksum(pluginPackagePath: string): Promise<string | null> {
        return new Promise((resolve) => {
            digestDirectory(
                pluginPackagePath,
                (digestErr, packageDigest) => {
                    if (!digestErr) {
                        return resolve(packageDigest);
                    }

                    resolve(null);
                }, (path) => {
                    return anymatch(IGNORE_PATHS, path);
                },
            );
        });
    }

    async _isBuildNecessary(pluginPackagePath: string, pluginPackageName: string): Promise<boolean> {
        const buildInfo = await this._loadBuildInfo(pluginPackageName);

        if (!buildInfo) {
            return true;
        }

        const packageChecksum = await this._getBuildChecksum(pluginPackagePath);
        if (!packageChecksum || packageChecksum !== buildInfo.buildPackageChecksum) {
            return true;
        }

        return false;
    }

    async _processQueueEntry(queueEntry: BuildQueueEntry) {
        const { pluginPackageName, pluginPackagePath } = queueEntry;
        this.removeFromBuildQueue(pluginPackageName);

        const isBuildNecessary = await this._isBuildNecessary(pluginPackagePath, pluginPackageName);
        if (!isBuildNecessary) {
            this._eventEmitter.emit('build-finished', {
                pluginPackageName: queueEntry.pluginPackageName,
                success: true,
            });
            return;
        }

        let buildInfo: ?BuildInfo = null;

        try {
            buildInfo = await this._loadBuildInfo(queueEntry.pluginPackageName);
            if (!buildInfo) {
                buildInfo = {
                    lastDependenciesUpdate: null,
                    buildStart: Date.now(),
                    buildEnd: null,
                    buildStatus: 'running',
                };
            } else if (buildInfo.buildStatus !== 'running') {
                if (buildInfo.buildEnd && buildInfo.buildEnd > queueEntry.lastSourceUpdateTimestamp) {
                    // Already built
                    return;
                }
            } else {
                if (this._getBuildInfoLastUpdateTst(queueEntry.pluginPackageName) > Date.now() - RETRY_RUNNING_BUILD_AFTER_MS) {
                    this._log.debug(`Build already running: ${queueEntry.pluginPackageName}. Re-checking later.`);
                    this._buildQueue.push(queueEntry);
                    return;
                } else {
                    this._log.debug(`Build of ${queueEntry.pluginPackageName} is in running state since more than ${RETRY_RUNNING_BUILD_AFTER_MS / 1000} sec. Starting new build.`);
                }
            }

            this._log.info(`Starting build: ${queueEntry.pluginPackageName}`);
            buildInfo.buildStart = Date.now();
            buildInfo.buildStatus = 'running';
            buildInfo.buildErrorMessage = null;
            buildInfo.buildEnd = null;
            await this._updateBuildInfo(queueEntry.pluginPackageName, buildInfo);

            await this._build(queueEntry);

            const packageChecksum = await this._getBuildChecksum(pluginPackagePath);
            if (packageChecksum) {
                buildInfo.buildPackageChecksum = packageChecksum;
            }

            this._log.info(`Build success: ${queueEntry.pluginPackageName}. Build took ${(Date.now() - buildInfo.buildStart) /1000} sec`);
            buildInfo.buildEnd = Date.now();
            buildInfo.buildStatus = 'success';
            await this._updateBuildInfo(queueEntry.pluginPackageName, buildInfo);

            this._eventEmitter.emit('build-finished', {
                pluginPackageName: queueEntry.pluginPackageName,
                success: true,
            });

        } catch (error) {
            this._log.error(`Error building plugin package: ${queueEntry.pluginPackageName}.`, error);
            const errorMessage = stripAnsi(error.toString());

            if (buildInfo) {
                buildInfo.buildStatus = 'error';
                buildInfo.buildErrorMessage = errorMessage;
                await this._updateBuildInfo(queueEntry.pluginPackageName, buildInfo);
            }

            this._eventEmitter.emit('build-finished', {
                pluginPackageName: queueEntry.pluginPackageName,
                success: false,
                errorMessage,
            });
        }
    }

    async _build(queueEntry: BuildQueueEntry) {
        if (!this._nodeModulesExists(queueEntry.pluginPackagePath)) {
            this._log.debug(`No node_modules folder found. Running npm install: ${queueEntry.pluginPackageName}`);
            await this._npmUtils.install(queueEntry.pluginPackagePath);
        }

        const buildScript = queueEntry.buildScript;
        if (buildScript) {
            this._log.debug(`Running build script '${buildScript}': ${queueEntry.pluginPackageName}`);
            await this._npmUtils.runScript(queueEntry.pluginPackagePath, buildScript);
        }
    }

    async _loadBuildInfo(pluginPackageName: string): Promise<BuildInfo | null> {
        const buildInfoFile = this._getBuildInfoFile(pluginPackageName);
        if (!fs.existsSync(buildInfoFile)) {
            return null;
        }

        try {
            const data = await readFile(buildInfoFile, 'utf8');
            return JSON.parse(data.toString());
        } catch (e) {
            this._log.error('Unable to get current build info file. Creating new one.', e);
            return null;
        }
    }

    async _updateBuildInfo(pluginPackageName: string, buildInfo: BuildInfo) {
        const buildInfoFile = this._getBuildInfoFile(pluginPackageName);
        ensureDirSync(path.resolve(buildInfoFile, '..'));

        try {
            return writeFile(buildInfoFile, JSON.stringify(buildInfo), 'utf8');
        } catch (e) {
            this._log.error(`Error updating build info file for plugin package: ${pluginPackageName}`, e);
            // Something is wrong, remove the build file
            try {
                fs.unlinkSync(buildInfoFile);
            } catch (e2) {
                // Ignore
            }
        }
    }

    _getBuildInfoFile(pluginPackageName: string) {
        return path.resolve(this._buildDataFolder, `${pluginPackageName}.build.json`);
    }

    _nodeModulesExists(pluginPackagePath: string) {
        const nodeModules = path.resolve(pluginPackagePath, 'node_modules');
        return fs.existsSync(nodeModules);
    }

    _getBuildInfoLastUpdateTst(pluginPackageName: string) {
        const buildInfo = this._getBuildInfoFile(pluginPackageName);
        if (!fs.existsSync(buildInfo)) {
            return Date.now();
        }
        return fs.statSync(buildInfo).mtimeMs;
    }
}

