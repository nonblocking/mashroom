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
    _eventEmitter: EventEmitter;
    _numberBuilds: number;
    _processQueueInterval: ?IntervalID;

    constructor(config: MashroomServerConfig, loggerFactory: MashroomLoggerFactory) {
        this._buildDataFolder = path.resolve(config.tmpFolder, config.name, 'build-data');
        this._log = loggerFactory('mashroom.plugins.build');
        this._npmUtils = new NpmUtils(loggerFactory);
        this._eventEmitter = new EventEmitter();
        this._eventEmitter.setMaxListeners(0);
        this._numberBuilds = 0;

        this._buildQueue = [];

        this._log.info(`Build data folder: ${this._buildDataFolder}`);
        ensureDirSync(this._buildDataFolder);
        this._processQueueInterval = setInterval(this._processBuildQueue.bind(this), 2000);
    }

    addPackageToBuildQueue(pluginPackageName: string, pluginPackagePath: string, buildScript: ?string, lastSourceUpdateTimestamp?: number = Date.now()) {
        this.removeFromBuildQueue(pluginPackageName);

        this._buildQueue.push({
            pluginPackageName,
            pluginPackagePath,
            buildScript,
            lastSourceUpdateTimestamp,
        });
    }

    addToBuildQueue(pluginPackageName: string, pluginPackagePath: string, buildScript: ?string, lastSourceUpdateTimestamp?: number = Date.now()) {
        const IGNORE_PATHS: Array<string> = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/public/**', '**/.mashroom-dev.chsum'];
        const digestFile = path.resolve(pluginPackagePath, '.mashroom-dev.chsum');
        if (fs.existsSync(digestFile)) {
            const storedPackageDigest = fs.readFileSync(digestFile).toString();
            digestDirectory(
                pluginPackagePath,
                (err, packageDigest) => {
                    if (storedPackageDigest !== packageDigest) {
                        fs.writeFileSync(digestFile, packageDigest);
                        this.addPackageToBuildQueue(pluginPackageName, pluginPackagePath, buildScript, lastSourceUpdateTimestamp);
                    } else {
                        this._eventEmitter.emit('build-finished', {
                            pluginPackageName,
                            success: true,
                        });
                    }
                }, (path) => {
                    return anymatch(IGNORE_PATHS, path);
                },
            );
        } else {
            digestDirectory(
                pluginPackagePath,
                (err, packageDigest) => {
                    fs.writeFileSync(digestFile, packageDigest);
                    this.addPackageToBuildQueue(pluginPackageName, pluginPackagePath, buildScript, lastSourceUpdateTimestamp);
                }, (path) => {
                    return anymatch(IGNORE_PATHS, path);
                },
            );
        }
    }

    removeFromBuildQueue(pluginPackageName: string) {
        const existingEntryIndex = this._buildQueue.findIndex((e) => e.pluginPackageName === pluginPackageName);
        if (existingEntryIndex > -1) {
            this._buildQueue.splice(existingEntryIndex, 1);
        }
    }

    stopProcessing() {
        if (this._processQueueInterval) {
            clearInterval(this._processQueueInterval);
        }
    }

    on(eventName: MashroomPluginPackageBuilderEventName, listener: MashroomPluginPackageBuilderEvent => void) {
        this._eventEmitter.on(eventName, listener);
    }

    removeListener(eventName: MashroomPluginPackageBuilderEventName, listener: MashroomPluginPackageBuilderEvent => void): void {
        this._eventEmitter.removeListener(eventName, listener);
    }

    async _processBuildQueue() {
        const buildJobs = this._buildQueue.length;
        if (buildJobs || this._numberBuilds > 0) {
            this._log.debug(`Builds running: ${this._numberBuilds}/${MAX_PARALLEL_BUILDS}`);
        }
        if (buildJobs) {
            const availableWorkers = Math.max(0, MAX_PARALLEL_BUILDS - this._numberBuilds);
            const buildCandidates = [...this._buildQueue].slice(0, availableWorkers);

            if (buildCandidates.length > 0) {
                this._log.debug(`Adding ${buildCandidates.length} out of ${buildJobs} pending build jobs.`);
                for (let i = 0; i < buildCandidates.length; i ++) {
                    try {
                        this._numberBuilds ++;
                        await this._processQueueEntry(buildCandidates[i])
                    } finally {
                        this._numberBuilds --;
                    }
                }
            }
        }
    }

    async _processQueueEntry(queueEntry: BuildQueueEntry) {
        this.removeFromBuildQueue(queueEntry.pluginPackageName);
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

    async _loadBuildInfo(pluginPackageName: string) {
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

