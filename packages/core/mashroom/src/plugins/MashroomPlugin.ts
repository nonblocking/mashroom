
import {resolve} from 'path';
import {cloneAndFreezeObject} from '@mashroom/mashroom-utils/lib/readonly_utils';
import PluginBootstrapError from '@mashroom/mashroom-utils/lib/PluginBootstrapError';

import type {
    MashroomPlugin as MashroomPluginType, MashroomPluginType as MashroomPluginTypeType, MashroomPluginDefinition, MashroomPluginConfig,
    MashroomPluginStatus, MashroomPluginPackage, MashroomLoggerFactory, MashroomLogger,
} from '../../type-definitions';
import type {
    MashroomPluginRegistryConnector, MashroomPluginRegistryConnectorEvent,
} from '../../type-definitions/internal';

export default class MashroomPlugin implements MashroomPluginType {

    private readonly _logger: MashroomLogger;
    private _config: MashroomPluginConfig | undefined | null;
    private _lastReloadTs: number | undefined | null;
    private _errorMessage: string | undefined | null;
    private _status: MashroomPluginStatus;

    constructor(private _pluginDefinition: MashroomPluginDefinition, private _pluginPackage: MashroomPluginPackage, registryConnector: MashroomPluginRegistryConnector, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins');
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

        this._logger.info(`Loading bootstrap for plugin ${this.name}: ${bootstrapFullPath}`);
        let bootstrap = null;
        try {
            bootstrap = require(bootstrapFullPath);
        } catch (e) {
            this._logger.error(`Loading bootstrap of plugin ${this.name} failed`, e);
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
        return resolve(this.pluginPackage.pluginPackagePath, this._pluginDefinition.bootstrap);
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

    get description(): string | undefined | null {
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

    get lastReloadTs(): number | undefined | null {
        return this._lastReloadTs;
    }

    get errorMessage(): string | undefined | null {
        return this._errorMessage;
    }

    get pluginDefinition(): MashroomPluginDefinition {
        return cloneAndFreezeObject(this._pluginDefinition);
    }

    get config(): MashroomPluginConfig | undefined | null {
        return this._config;
    }

    get pluginPackage(): MashroomPluginPackage {
        return this._pluginPackage;
    }
}
