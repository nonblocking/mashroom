
import {resolve} from 'path';
import {existsSync, unlinkSync, statSync} from 'fs';
import {readFile, writeFile} from 'fs/promises';
import {EventEmitter} from 'events';
import {ensureDirSync} from 'fs-extra';
import digestDirectory from 'lucy-dirsum';
import anymatch from 'anymatch';
import {stripAnsiColors} from '../../utils/log-utils';
import {IGNORE_CHANGES_IN_PATHS} from '../scanner/MashroomPluginPackageScanner';
import NpmUtils from './NpmUtils';
import NxUtils from './NxUtils';

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

const MAX_PARALLEL_BUILDS = 5;
const RETRY_RUNNING_BUILD_AFTER_MS = 10 * 1000;

type BuildQueueEntry = {
    readonly pluginPackageName: string;
    readonly pluginPackagePath: string;
    readonly buildScript: string | undefined | null;
    readonly lastSourceUpdateTimestamp: number;
}

type BuildStatus = 'running' | 'success' | 'error';
type BuildInfo = {
    buildStart: number;
    buildEnd: number | undefined | null;
    buildStatus: BuildStatus;
    buildErrorMessage?: string| undefined | null;
    buildPackageChecksum?: string;
    lastDependenciesUpdate?: number | undefined | null;
};

/**
 * Build service for plugin packages.
 * There should only be one per cluster - the other nodes will get the events per IPC.
 */
export default class MashroomPluginPackageBuilder implements MashroomPluginPackageBuilderType {

    private readonly _logger: MashroomLogger;
    private readonly _buildDataFolder: string;
    private readonly _npmUtils: NpmUtils;
    private readonly _nxUtils: NxUtils;
    private readonly _devModeDisableNxSupport: boolean;
    private readonly _buildQueue: Array<BuildQueueEntry>;
    private readonly _buildSlots: Array<Promise<void>>;
    private readonly _eventEmitter: EventEmitter;
    private _processingAllowed: boolean;

    constructor(config: MashroomServerConfig, loggerFactory: MashroomLoggerFactory) {
        this._buildDataFolder = resolve(config.tmpFolder, config.name, 'build-data');
        this._logger = loggerFactory('mashroom.plugins.build');
        this._npmUtils = new NpmUtils(loggerFactory, config.devModeNpmExecutionTimeoutSec || undefined);
        this._nxUtils = new NxUtils(loggerFactory, config.devModeNpmExecutionTimeoutSec || undefined);
        this._devModeDisableNxSupport = !!config.devModeDisableNxSupport;
        this._eventEmitter = new EventEmitter();
        this._eventEmitter.setMaxListeners(0);

        this._buildQueue = [];
        this._buildSlots = [];

        this._logger.info(`Build data folder: ${this._buildDataFolder}`);
        ensureDirSync(this._buildDataFolder);
        this._processingAllowed = true;
    }

    addToBuildQueue(pluginPackageName: string, pluginPackagePath: string, buildScript: string | undefined | null, lastSourceUpdateTimestamp = Date.now()): void {
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

    removeFromBuildQueue(pluginPackageName: string): void {
        const existingEntryIndex = this._buildQueue.findIndex((e) => e.pluginPackageName === pluginPackageName);
        if (existingEntryIndex > -1) {
            this._buildQueue.splice(existingEntryIndex, 1);
        }
    }

    stopProcessing(): void {
        this._processingAllowed = false;
    }

    on(eventName: MashroomPluginPackageBuilderEventName, listener: (event: MashroomPluginPackageBuilderEvent) => void): void {
        this._eventEmitter.on(eventName, listener);
    }

    removeListener(eventName: MashroomPluginPackageBuilderEventName, listener: (event: MashroomPluginPackageBuilderEvent) => void): void {
        this._eventEmitter.removeListener(eventName, listener);
    }

    private async _processBuildQueue() {
        if (this._buildSlots.length >= MAX_PARALLEL_BUILDS) {
            // all slots are full
            this._logger.debug(`Builds running: ${this._buildSlots.length} of ${MAX_PARALLEL_BUILDS} possible`);
            return;
        }

        while (this._buildQueue.length > 0) {
            this._logger.debug(`Builds running: ${this._buildSlots.length} of ${MAX_PARALLEL_BUILDS} possible`);

            const availableWorkers = Math.max(0, MAX_PARALLEL_BUILDS - this._buildSlots.length);
            const buildCandidates = [...this._buildQueue].slice(0, availableWorkers);

            if (buildCandidates.length > 0) {
                this._logger.debug(`Adding ${buildCandidates.length} out of ${this._buildQueue.length} pending build jobs.`);
                this._buildSlots.push(...buildCandidates.map(bc => this._processQueueEntry(bc)));
                const finishedIdx = await Promise.race(this._buildSlots.map((build, idx) => build.then(() => idx)));
                this._logger.debug(`Build #${finishedIdx} out of ${this._buildSlots.length} pending jobs finished.`);
                this._buildSlots.splice(finishedIdx, 1);
            }
        }
    }

    private async _getBuildChecksum(pluginPackagePath: string): Promise<string | null> {
        return new Promise((resolve) => {
            digestDirectory(
                pluginPackagePath,
                (digestErr: Error | null, packageDigest: string | null) => {
                    if (!digestErr) {
                        return resolve(packageDigest);
                    }

                    resolve(null);
                }, (path: string) => {
                    return anymatch(IGNORE_CHANGES_IN_PATHS, path);
                },
            );
        });
    }

    private async _isBuildNecessary(pluginPackagePath: string, pluginPackageName: string, buildInfo: BuildInfo | undefined | null): Promise<boolean> {
        if (!buildInfo) {
            return true;
        }

        if (buildInfo.buildStatus !== 'success') {
            return true;
        }

        const packageChecksum = await this._getBuildChecksum(pluginPackagePath);

        return !packageChecksum || packageChecksum !== buildInfo.buildPackageChecksum;
    }

    private async _processQueueEntry(queueEntry: BuildQueueEntry) {
        const { pluginPackageName, pluginPackagePath } = queueEntry;
        this.removeFromBuildQueue(pluginPackageName);

        let buildInfo: BuildInfo | undefined | null = null;

        try {
            buildInfo = await this._loadBuildInfo(queueEntry.pluginPackageName);
            const buildNecessary = await this._isBuildNecessary(pluginPackagePath, pluginPackageName, buildInfo);

            if (!buildInfo) {
                buildInfo = {
                    lastDependenciesUpdate: null,
                    buildStart: Date.now(),
                    buildEnd: null,
                    buildStatus: 'running',
                };
            } else if (!buildNecessary || (buildInfo.buildStatus !== 'running' && buildInfo.buildEnd && buildInfo.buildEnd > queueEntry.lastSourceUpdateTimestamp)) {
                // No build necessary or already built by another instance
                this._eventEmitter.emit('build-finished', {
                    pluginPackageName: queueEntry.pluginPackageName,
                    success: true,
                });
                return;
            } else if (buildInfo.buildStatus === 'running') {
                if (this._getBuildInfoLastUpdateTst(queueEntry.pluginPackageName) > Date.now() - RETRY_RUNNING_BUILD_AFTER_MS) {
                    this._logger.debug(`The package ${queueEntry.pluginPackageName} is already built by another Mashroom instance. Re-checking later.`);
                    setTimeout(() => {
                        this._buildQueue.push(queueEntry);
                    }, RETRY_RUNNING_BUILD_AFTER_MS);
                    return;
                } else {
                    this._logger.debug(`Build of ${queueEntry.pluginPackageName} is in running state since more than ${RETRY_RUNNING_BUILD_AFTER_MS / 1000} sec. Starting new build.`);
                }
            }

            this._logger.info(`Starting build: ${queueEntry.pluginPackageName}`);
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

            this._logger.info(`Build success: ${queueEntry.pluginPackageName}. Build took ${(Date.now() - buildInfo.buildStart) /1000} sec`);
            buildInfo.buildEnd = Date.now();
            buildInfo.buildStatus = 'success';
            await this._updateBuildInfo(queueEntry.pluginPackageName, buildInfo);

            this._eventEmitter.emit('build-finished', {
                pluginPackageName: queueEntry.pluginPackageName,
                success: true,
            });

        } catch (error: any) {
            this._logger.error(`Error building plugin package: ${queueEntry.pluginPackageName}.`, error);
            const errorMessage = stripAnsiColors(error.toString());

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

    private async _build(queueEntry: BuildQueueEntry) {
        if (this._npmUtils.isRootPackage(queueEntry.pluginPackagePath) && !this._npmUtils.nodeModulesExists(queueEntry.pluginPackagePath)) {
            this._logger.debug(`No node_modules folder found. Running npm install: ${queueEntry.pluginPackageName}`);
            await this._npmUtils.install(queueEntry.pluginPackagePath);
        }

        const buildScript = queueEntry.buildScript;
        if (buildScript) {
            this._logger.debug(`Running build script '${buildScript}': ${queueEntry.pluginPackageName}`);
            if (!this._devModeDisableNxSupport && await this._nxUtils.isNxAvailable(queueEntry.pluginPackagePath)) {
                await this._nxUtils.runScript(queueEntry.pluginPackagePath, buildScript);
            } else {
                await this._npmUtils.runScript(queueEntry.pluginPackagePath, buildScript);
            }
        }
    }

    private async _loadBuildInfo(pluginPackageName: string): Promise<BuildInfo | undefined | null> {
        const buildInfoFile = this._getBuildInfoFile(pluginPackageName);
        if (!existsSync(buildInfoFile)) {
            return null;
        }

        try {
            const data = await readFile(buildInfoFile, 'utf8');
            return JSON.parse(data.toString());
        } catch (e) {
            this._logger.error('Unable to get current build info file. Creating new one.', e);
            return null;
        }
    }

    async _updateBuildInfo(pluginPackageName: string, buildInfo: BuildInfo) {
        const buildInfoFile = this._getBuildInfoFile(pluginPackageName);
        ensureDirSync(resolve(buildInfoFile, '..'));

        try {
            return writeFile(buildInfoFile, JSON.stringify(buildInfo), 'utf8');
        } catch (e) {
            this._logger.error(`Error updating build info file for plugin package: ${pluginPackageName}`, e);
            // Something is wrong, remove the build file
            try {
                unlinkSync(buildInfoFile);
            } catch (e2) {
                // Ignore
            }
        }
    }

    private _getBuildInfoFile(pluginPackageName: string) {
        return resolve(this._buildDataFolder, `${pluginPackageName}.build.json`);
    }

    private _getBuildInfoLastUpdateTst(pluginPackageName: string) {
        const buildInfo = this._getBuildInfoFile(pluginPackageName);
        if (!existsSync(buildInfo)) {
            return Date.now();
        }
        return statSync(buildInfo).mtimeMs;
    }
}

