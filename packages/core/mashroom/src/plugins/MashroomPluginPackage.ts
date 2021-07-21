
import {readFile as readFileCb} from 'fs';
import {resolve} from 'path';
import {promisify} from 'util';
import {EventEmitter} from 'events';
import {cloneAndFreezeArray} from '@mashroom/mashroom-utils/lib/readonly_utils';
import {evaluateTemplatesInConfigObject, INVALID_PLUGIN_NAME_CHARACTERS} from '@mashroom/mashroom-utils/lib/config_utils';
import {removePackageModulesFromNodeCache} from '../utils/reload_utils';

import type {
    MashroomPluginPackage as MashroomPluginPackageType,
    MashroomPluginPackageEvent,
    MashroomPluginPackageEventName,
    MashroomPluginDefinition,
    MashroomLoggerFactory,
    MashroomLogger,
    MashroomPluginPackageStatus,
    MashroomPluginPackageDefinition,
} from '../../type-definitions';
import type {
    MashroomPluginPackageRegistryConnector,
    MashroomPluginPackageBuilder,
    MashroomPluginPackageBuilderEvent,
} from '../../type-definitions/internal';
import {getExternalPluginDefinitionFilePath} from '../utils/plugin_utils';

const readFile = promisify(readFileCb);

export default class MashroomPackagePlugin implements MashroomPluginPackageType {

    private _logger: MashroomLogger;
    private _eventEmitter: EventEmitter;
    private _name: string;
    private _description: string;
    private _version: string;
    private _homepage: string | undefined | null;
    private _author: string | undefined | null;
    private _license: string | undefined | null;
    private _pluginDefinitions: Array<MashroomPluginDefinition>;
    private _pluginPackageDefinition: MashroomPluginPackageDefinition;
    private _status: MashroomPluginPackageStatus;
    private _errorMessage: string | undefined | null;
    private _boundOnUpdated: () => void;
    private _boundOnRemoved: () => void;
    private _boundOnBuildFinished: (event: MashroomPluginPackageBuilderEvent) => void;


    constructor(private _pluginPackagePath: string, private _ignorePlugins: Array<string>, private _externalPluginConfigFileNames: Array<string>,
                private _registryConnector: MashroomPluginPackageRegistryConnector,
                private _builder: MashroomPluginPackageBuilder | undefined | null, loggerFactory: MashroomLoggerFactory) {
        this._eventEmitter = new EventEmitter();
        this._eventEmitter.setMaxListeners(0);
        this._logger = loggerFactory('mashroom.plugins');
        this._status = 'pending';
        this._errorMessage = null;
        this._pluginDefinitions = [];

        this._boundOnUpdated = this._onUpdated.bind(this);
        this._boundOnRemoved = this._onRemoved.bind(this);
        this._boundOnBuildFinished = this._onBuildFinished.bind(this);
        this._registryConnector.on('updated', this._boundOnUpdated);
        this._registryConnector.on('removed', this._boundOnRemoved);

        this._name = '';
        this._description = '';
        this._version = '';
        this._pluginPackageDefinition = {} as any;

        if (this._builder) {
            this._builder.on('build-finished', this._boundOnBuildFinished);
        }

        this._buildPackage();
    }

    on(eventName: MashroomPluginPackageEventName, listener: (event: MashroomPluginPackageEvent) => void): void {
        this._eventEmitter.on(eventName, listener);
    }

    removeListener(eventName: MashroomPluginPackageEventName, listener: (event: MashroomPluginPackageEvent) => void): void {
        this._eventEmitter.removeListener(eventName, listener);
    }

    private async _buildPackage() {
        this._status = 'building';
        this._errorMessage = null;
        this._registryConnector.removeListener('updated', this._boundOnUpdated);

        let packageJson = null;
        try {
            packageJson = await this._readPackageJson();
        } catch (err) {
            this._logger.error(`Error reading package.json in: ${this._pluginPackagePath}`, err);
            this._status = 'error';
            this._errorMessage = 'Error reading package.json';
            this._emitError();
            return;
        }

        this._name = packageJson.name;
        this._description = packageJson.description;
        this._version = packageJson.version;
        this._homepage = packageJson.homepage;
        this._author = this._authorToString(packageJson.author);
        this._license = packageJson.license;

        let pluginDefinition = this._readExternalPluginConfigFile();
        if (!pluginDefinition && packageJson.mashroom) {
            pluginDefinition = packageJson.mashroom;
        }

        if (!pluginDefinition) {
            this._logger.error(`No plugin definition found in: ${this._pluginPackagePath}. Neither does package.json contain a "mashroom" property nor does an external plugin definition file exist.`);
            this._status = 'error';
            this._errorMessage = `No plugin definition found`;
            this._emitError();
            return;
        }
        if (!pluginDefinition.plugins || !Array.isArray(pluginDefinition.plugins)) {
            this._logger.error(`Error processing plugin definition in: ${this._pluginPackagePath}: "plugins" is either not defined or no array!`);
            this._status = 'error';
            this._errorMessage = `Invalid plugin definition: "plugins" is either not defined or no array`;
            this._emitError();
            return;
        }

        this._pluginPackageDefinition = pluginDefinition;
        let plugins = this._checkPluginDefinitions(this._pluginPackageDefinition.plugins);

        // Check ignore list
        if (this._ignorePlugins && this._ignorePlugins.length > 0) {
            plugins = plugins.filter((p) => {
                if (this._ignorePlugins.indexOf(p.name) !== -1) {
                    this._logger.info(`Ignoring plugin '${p.name}' because it's on the ignore list`);
                    return false;
                }

                return true;
            });
        }

        this._pluginPackageDefinition.plugins = plugins;

        if (this._builder) {
            this._builder.addToBuildQueue(this._name, this._pluginPackagePath, this._pluginPackageDefinition.devModeBuildScript);
        } else {
            this._emitReady();
            this._registryConnector.on('updated', this._boundOnUpdated);
        }
    }

    private async _readPackageJson(): Promise<any> {
        const fileData = await readFile(resolve(this._pluginPackagePath, 'package.json'), 'utf-8');
        return JSON.parse(fileData.toString());
    }

    private _readExternalPluginConfigFile(): MashroomPluginPackageDefinition | undefined {
        const externalPluginConfigFile = getExternalPluginDefinitionFilePath(this._pluginPackagePath, this._externalPluginConfigFileNames);
        if (!externalPluginConfigFile) {
            return;
        }

        this._logger.debug('Loading plugin config file:', externalPluginConfigFile);
        // Reload
        delete require.cache[externalPluginConfigFile];
        return require(externalPluginConfigFile);
    }

    private _onBuildFinished(event: MashroomPluginPackageBuilderEvent) {
        if (event.pluginPackageName === this._name) {
            if (event.success) {
               this._emitReady();
            } else {
                this._status = 'error';
                this._errorMessage = event.errorMessage;
                this._emitError();
            }

            this._registryConnector.on('updated', this._boundOnUpdated);
        }
    }

    private _onUpdated() {
        if (this._status !== 'building') {
            this._buildPackage();
        }

        this._removeModulesFromNodeCache();
    }

    private _onRemoved() {
        this._registryConnector.removeListener('updated', this._boundOnUpdated);
        this._registryConnector.removeListener('removed', this._boundOnRemoved);

        if (this._builder) {
            this._builder.removeListener('build-finished', this._boundOnBuildFinished);
        }

        this._eventEmitter.emit('removed', {
            pluginPackage: this,
        });

        this._removeModulesFromNodeCache();
    }

    private _removeModulesFromNodeCache() {
        removePackageModulesFromNodeCache(this._pluginPackagePath);
    }

    private _emitReady() {
        const pluginsAdded = this._pluginPackageDefinition.plugins.filter((p) => !this.pluginDefinitions.find((existingPlugin) => existingPlugin.name === p.name));
        const pluginsUpdated = this._pluginPackageDefinition.plugins.filter((p) => this.pluginDefinitions.find((existingPlugin) => existingPlugin.name === p.name));
        const pluginsRemoved = this.pluginDefinitions.filter((existingPlugin) => !this._pluginPackageDefinition.plugins.find((p) => p.name === existingPlugin.name));
        this._pluginDefinitions = this._pluginPackageDefinition.plugins;

        this._status = 'ready';
        this._eventEmitter.emit('ready', {
            pluginsAdded,
            pluginsUpdated,
            pluginsRemoved,
            pluginPackage: this,
        });
    }

    private _emitError() {
        this._eventEmitter.emit('error', {
            errorMessage: this._errorMessage,
            pluginPackage: this,
        });
    }

    private _checkPluginDefinitions(rawPluginDefinitions: Array<any>): Array<MashroomPluginDefinition> {
        const fixedPluginDefinitions = rawPluginDefinitions.filter((p) => {
            if (!p.name) {
                this._logger.error(`Ignoring plugin in package ${this._name} because it has no name property.`);
                return false;
            }
            if (p.name.match(INVALID_PLUGIN_NAME_CHARACTERS)) {
                this._logger.error(`Ignoring plugin ${p.name} in package ${this._name} because its name has invalid characters (/,?).`);
                return false;
            }
            if (!p.type) {
                this._logger.error(`Ignoring plugin ${p.name} in package ${this._name} because it has no type property.`);
                return false;
            }

            return true;
        });

        // Fix description
        fixedPluginDefinitions.forEach((p) => {
            if (!p.description) {
                this._logger.info(`Plugin ${p.name} in package ${this._name} has no description property, using description from package.`);
                p.description = this._description;
            }
        });

        // Evaluate templates in the config object
        fixedPluginDefinitions.forEach((p) => {
            if (p.defaultConfig) {
                evaluateTemplatesInConfigObject(p.defaultConfig, this._logger);
            }
        });

        return fixedPluginDefinitions;
    }

    private _authorToString(author: string | any): string | undefined | null {
        if (!author) {
            return null;
        }
        if (typeof (author) === 'string') {
            return author;
        }
        return `${author.name || ''} <${author.email || '??'}>`;
    }

    get name(): string {
        return this._name;
    }

    get description(): string {
        return this._description;
    }

    get version(): string {
        return this._version;
    }

    get homepage(): string | undefined | null {
        return this._homepage;
    }

    get author(): string | undefined | null {
        return this._author;
    }

    get license(): string | undefined | null {
        return this._license;
    }

    get pluginPackagePath(): string {
        return this._pluginPackagePath;
    }

    get pluginDefinitions(): Readonly<Array<MashroomPluginDefinition>> {
        return cloneAndFreezeArray(this._pluginDefinitions);
    }

    get status(): MashroomPluginPackageStatus {
        return this._status;
    }

    get errorMessage(): string | undefined | null {
        return this._errorMessage;
    }
}

