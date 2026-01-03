import {resolve} from 'path';
import {fileURLToPath} from 'url';
import {readonlyUtils, moduleUtils, PluginBootstrapError} from '@mashroom/mashroom-utils';
import type {
    MashroomPlugin as MashroomPluginType,
    MashroomPluginDefinition,
    MashroomPluginConfig,
    MashroomPluginStatus,
    MashroomPluginPackage,
    MashroomLoggerFactory,
    MashroomLogger,
} from '../../type-definitions';

export default class MashroomPlugin implements MashroomPluginType {

    private readonly _logger: MashroomLogger;
    private _config: MashroomPluginConfig | undefined | null;
    private _lastReloadTs: number | undefined | null;
    private _errorMessage: string | undefined | null;
    private _status: MashroomPluginStatus;

    constructor(private _pluginDefinition: MashroomPluginDefinition, private _pluginPackage: MashroomPluginPackage, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins');
        this._status = 'pending';
    }

    async loadBootstrap(): Promise<any> {
        const bootstrapFullPath = this._getBootstrapFullPath();
        if (!bootstrapFullPath) {
            throw new PluginBootstrapError(`No bootstrap defined for plugin: ${this.name}`);
        }

        this._logger.info(`Loading bootstrap for plugin '${this.name}': ${bootstrapFullPath}`);

        let bootstrap = null;
        try {
            bootstrap = await moduleUtils.loadModule(bootstrapFullPath);
        } catch (e) {
            this._logger.error(`Loading bootstrap of plugin '${this.name}' failed`, e);
            throw new PluginBootstrapError(`Loading bootstrap of plugin '${this.name}' failed: ${e}`);
        }

        if (typeof (bootstrap) === 'function') {
            return bootstrap;
        }

        throw new PluginBootstrapError(`Loading bootstrap of plugin '${this.name}' failed: Default export is no function!`);
    }

    requireBootstrap(): any {
        const bootstrapFullPath = this._getBootstrapFullPath();
        if (!bootstrapFullPath) {
            throw new PluginBootstrapError(`No bootstrap defined for plugin: ${this.name}`);
        }

        this._logger.info(`Loading bootstrap for plugin '${this.name}': ${bootstrapFullPath}`);
        let bootstrap = null;
        try {
            bootstrap = require(bootstrapFullPath);
        } catch (e) {
            this._logger.error(`Loading bootstrap of plugin '${this.name}' failed`, e);
            throw new PluginBootstrapError(`Loading bootstrap of plugin '${this.name}' failed: ${e}`);
        }

        if (typeof (bootstrap) === 'function') {
            return bootstrap;
        }
        if (typeof (bootstrap.default) === 'function') {
            return bootstrap.default;
        }

        throw new PluginBootstrapError(`Loading bootstrap of plugin '${this.name}' failed: Default export is no function!`);
    }

    _getBootstrapFullPath() {
        if (!this._pluginDefinition.bootstrap) {
            return null;
        }
        // At the moment we can only load bootstraps from the local file system
        if (this.pluginPackage.pluginPackageUrl.protocol !== 'file:') {
            throw new Error(`Cannot load bootstrap module from ${this.pluginPackage.pluginPackageUrl} because it is not a local file system URL`);
        }
        return resolve(fileURLToPath(this.pluginPackage.pluginPackageUrl), this._pluginDefinition.bootstrap);
    }

    get name() {
        return this._pluginDefinition.name;
    }

    get description() {
        return this._pluginDefinition.description;
    }

    get tags() {
        return this._pluginDefinition.tags || [];
    }

    get type() {
        return this._pluginDefinition.type;
    }

    get status() {
        return this._status;
    }

    get lastReloadTs() {
        return this._lastReloadTs;
    }

    get errorMessage() {
        return this._errorMessage;
    }

    get pluginDefinition() {
        return readonlyUtils.cloneAndFreezeObject(this._pluginDefinition);
    }

    get config() {
        return this._config;
    }

    get pluginPackage() {
        return this._pluginPackage;
    }

    setConfig(config: MashroomPluginConfig | undefined | null) {
        this._config = config;
    }

    setLastReloadTs(lastReloadTs: number) {
        this._lastReloadTs = lastReloadTs;
    }

    setStatus(status: MashroomPluginStatus) {
        this._status = status;
    }

    setErrorMessage(errorMessage: string | null) {
        this._errorMessage = errorMessage;
    }
}
