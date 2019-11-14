// @flow

import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import EventEmitter from 'events';
import {cloneAndFreezeArray} from '@mashroom/mashroom-utils/lib/readonly_utils';
import {removePackageModulesFromNodeCache} from '../utils/reload_utils';

import type {
    MashroomPluginPackage as MashroomPluginPackageType, MashroomPluginPackageEvent, MashroomPluginPackageEventName,
    MashroomPluginDefinition, MashroomPluginPackageDefinition, MashroomPluginPackageRegistryConnector, MashroomLoggerFactory,
    MashroomLogger, MashroomPluginPackageStatus, MashroomPluginPackageBuilder, MashroomPluginPackageBuilderEvent,
} from '../../type-definitions';

const readFile = promisify(fs.readFile);

export default class MashroomPackagePlugin implements MashroomPluginPackageType {

    _log: MashroomLogger;
    _pluginPackagePath: string;
    _registryConnector: MashroomPluginPackageRegistryConnector;
    _ignorePlugins: Array<string>;
    _builder: ?MashroomPluginPackageBuilder;
    _eventEmitter: EventEmitter;
    _name: string;
    _description: string;
    _version: string;
    _homepage: ?string;
    _author: ?string;
    _license: ?string;
    _pluginDefinitions: Array<MashroomPluginDefinition>;
    _pluginPackageDefinition: MashroomPluginPackageDefinition;
    _status: MashroomPluginPackageStatus;
    _errorMessage: ?string;

    _boundOnUpdated: () => void;
    _boundOnRemoved: () => void;
    _boundOnBuildFinished: (event: MashroomPluginPackageBuilderEvent) => void;

    /**
     * Constructor
     *
     * @constructor
     * @param {string} pluginPackagePath
     * @param {Array<string>} ignorePlugins
     * @param {string} registryConnector
     * @param {MashroomPluginPackageBuilder} builder
     * @param {MashroomLoggerFactory} loggerFactory
     */
    constructor(pluginPackagePath: string, ignorePlugins: Array<string>, registryConnector: MashroomPluginPackageRegistryConnector, builder: ?MashroomPluginPackageBuilder, loggerFactory: MashroomLoggerFactory) {
        this._pluginPackagePath = pluginPackagePath;
        this._ignorePlugins = ignorePlugins;
        this._registryConnector = registryConnector;
        this._builder = builder;
        this._eventEmitter = new EventEmitter();
        this._eventEmitter.setMaxListeners(0);
        this._log = loggerFactory('mashroom.plugins');
        this._status = 'pending';
        this._errorMessage = null;
        this._pluginDefinitions = [];

        this._boundOnUpdated = this._onUpdated.bind(this);
        this._boundOnRemoved = this._onRemoved.bind(this);
        this._boundOnBuildFinished = this._onBuildFinished.bind(this);
        this._registryConnector.on('updated', this._boundOnUpdated);
        this._registryConnector.on('removed', this._boundOnRemoved);

        if (this._builder) {
            this._builder.on('build-finished', this._boundOnBuildFinished);
        }

        this._buildPackage();
    }

    on(eventName: MashroomPluginPackageEventName, listener: MashroomPluginPackageEvent => void) {
        this._eventEmitter.on(eventName, listener);
    }

    removeListener(eventName: MashroomPluginPackageEventName, listener: MashroomPluginPackageEvent => void): void {
        this._eventEmitter.removeListener(eventName, listener);
    }

    async _buildPackage() {
        this._status = 'building';
        this._errorMessage = null;
        this._registryConnector.removeListener('updated', this._boundOnUpdated);

        let packageJson = null;
        try {
            packageJson = await this._readPackageJson();
        } catch (err) {
            this._log.error(`Error reading package.json in: ${this._pluginPackagePath}`, err);
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

        if (!packageJson.mashroom) {
            this._log.error(`Error processing package.json in: ${this._pluginPackagePath}: No 'mashroom' property found!`);
            this._status = 'error';
            this._errorMessage = `No 'mashroom' property found in package.json`;
            this._emitError();
            return;
        }

        if (!packageJson.mashroom.plugins || !Array.isArray(packageJson.mashroom.plugins)) {
            this._log.error(`Error processing package.json in: ${this._pluginPackagePath}: mashroom.plugins is either not defined or no array!`);
            this._status = 'error';
            this._errorMessage = `mashroom.plugins in package.json is either not defined or no array`;
            this._emitError();
            return;
        }

        this._pluginPackageDefinition = packageJson.mashroom;
        let plugins = this._checkPluginDefinitions(packageJson.mashroom.plugins);

        // Check ignore list
        if (this._ignorePlugins && this._ignorePlugins.length > 0) {
            plugins = plugins.filter((p) => {
                if (this._ignorePlugins.indexOf(p.name) !== -1) {
                    this._log.info(`Ignoring plugin '${p.name}' because it's on the ignore list`);
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

    async _readPackageJson() {
        const fileData = await readFile(path.resolve(this._pluginPackagePath, 'package.json'), 'utf-8');
        return JSON.parse(fileData.toString());
    }

    _onBuildFinished(event: MashroomPluginPackageBuilderEvent) {
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

    _onUpdated() {
        if (this._status !== 'building') {
            this._buildPackage();
        }

        this._removeModulesFromNodeCache();
    }

    _onRemoved() {
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

    _removeModulesFromNodeCache() {
        removePackageModulesFromNodeCache(this._pluginPackagePath);
    }

    _emitReady() {
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

    _emitError() {
        this._eventEmitter.emit('error', {
            errorMessage: this._errorMessage,
            pluginPackage: this,
        });
    }

    _checkPluginDefinitions(rawPluginDefinitions: Array<any>): Array<MashroomPluginDefinition> {
        const fixedPluginDefinitions = rawPluginDefinitions.filter((p) => {
            if (!p.type) {
                this._log.error(`Ignoring plugin ${p.name} in package ${this._name} because it has no type property.`);
                return false;
            }

            return true;
        });

        // Fix description
        fixedPluginDefinitions.forEach((p) => {
            if (!p.description) {
                this._log.info(`Plugin ${p.name} in package ${this._name} has no description property, using description from package.`);
                p.description = this._description;
            }
        });

        // Fix name
        fixedPluginDefinitions.forEach((p) => {
            if (!p.name) {
                this._log.info(`Plugin ${p.name} in package ${this._name} has no name property, generating one.`);
                let name = `${this._name} ${p.type}`;
                let index = 1;
                let postfix = '';
                while (this._pluginPackageDefinition.plugins.find((p) => p.name === name + postfix)) {
                    index++;
                    postfix = ` ${index}`;
                }
                p.name = name + postfix;
            }
        });

        return fixedPluginDefinitions;
    }

    _authorToString(author: string | any): ?string {
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

    get homepage(): ?string {
        return this._homepage;
    }

    get author(): ?string {
        return this._author;
    }

    get license(): ?string {
        return this._license;
    }

    get pluginPackagePath(): string {
        return this._pluginPackagePath;
    }

    get pluginDefinitions(): Array<MashroomPluginDefinition> {
        return cloneAndFreezeArray(this._pluginDefinitions);
    }

    get status(): MashroomPluginPackageStatus {
        return this._status;
    }

    get errorMessage(): ?string {
        return this._errorMessage;
    }
}

