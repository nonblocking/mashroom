// @flow

import path from 'path';
import {cloneAndFreezeObject} from '@mashroom/mashroom-utils/lib/readonly_utils';
import PluginBootstrapError from '@mashroom/mashroom-utils/lib/PluginBootstrapError';

import type {
    MashroomPlugin as MashroomPluginType, MashroomPluginType as MashroomPluginTypeType, MashroomPluginDefinition, MashroomPluginConfig,
    MashroomPluginRegistryConnector, MashroomPluginStatus, MashroomPluginPackage, MashroomLoggerFactory, MashroomLogger,
    MashroomPluginRegistryConnectorEvent,
} from '../../type-definitions';

export default class MashroomPlugin implements MashroomPluginType {

    _pluginDefinition: MashroomPluginDefinition;
    _pluginPackage: MashroomPluginPackage;
    _log: MashroomLogger;
    _config: ?MashroomPluginConfig;
    _lastReloadTs: ?number;
    _errorMessage: ?string;
    _status: MashroomPluginStatus;

    constructor(pluginDefinition: MashroomPluginDefinition, pluginPackage: MashroomPluginPackage, registryConnector: MashroomPluginRegistryConnector, loggerFactory: MashroomLoggerFactory) {
        this._pluginDefinition = pluginDefinition;
        this._pluginPackage = pluginPackage;
        this._log = loggerFactory('mashroom.plugins');
        this._status = 'pending';

        registryConnector.on('loaded', this._loaded.bind(this));
        registryConnector.on('updated', this._updated.bind(this));
        registryConnector.on('error', this._error.bind(this));
    }

    requireBootstrap<T>(): T {
        const bootstrapFullPath = this._getBootstrapFullPath();
        if (!bootstrapFullPath) {
            throw new PluginBootstrapError(`No bootstrap defined for plugin ${this.name}`);
        }

        this._log.info(`Loading bootstrap for plugin ${this.name}: ${bootstrapFullPath}`);
        let bootstrap = null;
        try {
            bootstrap = require(bootstrapFullPath);
        } catch (e) {
            this._log.error(`Loading bootstrap of plugin ${this.name} failed`, e);
            throw new PluginBootstrapError(`Loading bootstrap of plugin ${this.name} failed: ${e}`);
        }

        if (typeof (bootstrap) === 'function') {
            return bootstrap;
        }
        if (typeof (bootstrap.default) === 'function') {
            return bootstrap.default;
        }

        throw new PluginBootstrapError(`Loading bootstrap of plugin ${this.name} failed: Default export is no function!`);
    }

    _getBootstrapFullPath() {
        if (!this._pluginDefinition.bootstrap) {
            return null;
        }
        return path.resolve(this.pluginPackage.pluginPackagePath, this._pluginDefinition.bootstrap);
    }

    _loaded(event: MashroomPluginRegistryConnectorEvent) {
        this._config = event.pluginConfig;
        this._lastReloadTs = Date.now();
        this._status = 'loaded';
        this._errorMessage = null;
    }

    _updated(event: MashroomPluginRegistryConnectorEvent) {
        if (event.updatedPluginDefinition) {
            this._pluginDefinition = event.updatedPluginDefinition;
        }
    }

    _error(event: MashroomPluginRegistryConnectorEvent) {
        this._config = null;
        this._lastReloadTs = null;
        this._status = 'error';
        this._errorMessage = event.errorMessage;
    }

    get name(): string {
        return this._pluginDefinition.name;
    }

    get description(): ?string {
        return this._pluginDefinition.description;
    }

    get tags(): Array<string> {
        return this._pluginDefinition.tags || [];
    }

    get type(): MashroomPluginTypeType {
        return this._pluginDefinition.type;
    }

    get status(): MashroomPluginStatus {
        return this._status;
    }

    get lastReloadTs(): ?number {
        return this._lastReloadTs;
    }

    get errorMessage(): ?string {
        return this._errorMessage;
    }

    get pluginDefinition(): MashroomPluginDefinition {
        return cloneAndFreezeObject(this._pluginDefinition);
    }

    get config(): ?MashroomPluginConfig {
        return this._config;
    }

    get pluginPackage(): MashroomPluginPackage {
        return this._pluginPackage;
    }
}
