import {fileURLToPath} from 'url';
import {EventEmitter} from 'events';
import {readonlyUtils} from '@mashroom/mashroom-utils';
import {createPluginConfig} from '../utils/plugin-utils';
import {removePackageModulesFromNodeCache} from '../utils/reload-utils';
import fixAndValidatePluginPackageDefinition from './validation/fixAndValidatePluginPackageDefinition';
import MashroomPluginPackageImpl from './MashroomPluginPackage';
import MashroomPluginImpl from './MashroomPlugin';
import type {URL} from 'url';
import type {
    MashroomLogger,
    MashroomPluginContextHolder,
    MashroomPluginPackageDefinitionBuilder,
    MashroomPluginLoader,
    MashroomPluginLoaderMap,
    MashroomPluginPackageDefinition,
    MashroomPluginPackageScanner,
    MashroomPluginPackage,
    MashroomPlugin,
    MashroomPluginPackageDefinitionAndMeta,
    MashroomPluginType, MashroomLoggerFactory,
} from '../../type-definitions';
import type {
    MashroomPluginPackageBuilder,
    MashroomPluginPackageBuilderEvent,
    MashroomPluginPackageDefinitionBuilderWithWeight,
    MashroomPluginRegistry,
    MashroomPluginManager as MashroomPluginManagerType,
    MashroomPluginRegistryEvent,
    MashroomPluginRegistryEventName
} from '../../type-definitions/internal';

type PotentialPackage = {
    readonly url: URL;
    readonly scannerName: string;
    pluginPackageDefinition: MashroomPluginPackageDefinition | null;
    pluginPackage: MashroomPluginPackageImpl | null;
    plugins: Array<MashroomPluginImpl> | null;
}

export default class MashroomPluginManager implements MashroomPluginManagerType, MashroomPluginRegistry {

    private _started = false;
    private _potentialPackages: Array<PotentialPackage>;
    private readonly _pluginLoaders: MashroomPluginLoaderMap;
    private _pluginScanners: Array<MashroomPluginPackageScanner>;
    private _pluginDefinitionBuilders: Array<MashroomPluginPackageDefinitionBuilderWithWeight>;
    private readonly _pluginsNoLoader: Array<MashroomPlugin>;
    private readonly _pluginsMissingRequirements: Array<MashroomPlugin>;
    private readonly _eventEmitter: EventEmitter;
    private readonly _logger: MashroomLogger;

    constructor(private _pluginContextHolder: MashroomPluginContextHolder, private _loggerFactory: MashroomLoggerFactory,  private _builder: MashroomPluginPackageBuilder | undefined | null) {
        this._logger = _loggerFactory('mashroom.plugins.registry');
        this._potentialPackages = [];
        this._pluginLoaders = {};
        this._pluginScanners = [];
        this._pluginDefinitionBuilders = [];
        this._pluginsNoLoader = [];
        this._pluginsMissingRequirements = [];
        this._eventEmitter = new EventEmitter();
        this._eventEmitter.setMaxListeners(1000);

        if (this._builder) {
            this._builder.on('build-finished', this._onBuildPackageFinished.bind(this));
        }
    }

    async start() {
        for (let scanner of this._pluginScanners) {
            try {
                this._logger.info(`Starting plugin scanner: ${scanner.name}`);
                await scanner.start();
            } catch (e) {
                this._logger.warn(`Scanner '${scanner.name}' threw an error on start`, e);
            }
        }
        this._started = true;
    }

    async stop() {
        this._started = false;
        for (let scanner of this._pluginScanners) {
            try {
                this._logger.info(`Stopping plugin scanner: ${scanner.name}`);
                await scanner.stop();
            } catch (e) {
                this._logger.warn(`Scanner '${scanner.name}' threw an error on stop`, e);
            }
        }
    }

    get pluginPackageURLs(): Readonly<Array<URL>> {
        return readonlyUtils.cloneAndFreezeArray(this._potentialPackages.map((p) => p.url));
    }

    get pluginPackages(): Readonly<Array<MashroomPluginPackage>> {
        return readonlyUtils.cloneAndFreezeArray(this._potentialPackages
            .map((p) => p.pluginPackage).filter((p) => !!p));
    }

    get plugins(): Readonly<Array<MashroomPlugin>> {
        return readonlyUtils.cloneAndFreezeArray(this._potentialPackages
            .flatMap((p) => p.plugins).filter((p) => !!p));
    }

    get pluginLoaders() {
        return readonlyUtils.cloneAndFreezeObject(this._pluginLoaders);
    }

    get pluginPackageScanners() {
        return readonlyUtils.cloneAndFreezeArray(this._pluginScanners);
    }

    get pluginPackageDefinitionBuilders() {
        return readonlyUtils.cloneAndFreezeArray(this._pluginDefinitionBuilders);
    }

    on(eventName: MashroomPluginRegistryEventName, listener: (event: MashroomPluginRegistryEvent) => void) {
        this._eventEmitter.on(eventName, listener);
    }

    removeListener(eventName: MashroomPluginRegistryEventName, listener: (event: MashroomPluginRegistryEvent) => void): void {
        this._eventEmitter.removeListener(eventName, listener);
    }

    registerPluginLoader(type: MashroomPluginType, loader: MashroomPluginLoader) {
        this._pluginLoaders[type] = loader;
        // If a loader was reloaded, re-register all plugins
        this._reRegisterLoadedPlugins(type);
        this._checkPluginsNoLoader();
    }

    unregisterPluginLoader(type: MashroomPluginType, loader: MashroomPluginLoader) {
        if (this._pluginLoaders[type] && this._pluginLoaders[type]?.name === loader.name) {
            delete this._pluginLoaders[type];
        }
    }

    registerPluginScanner(scanner: MashroomPluginPackageScanner) {
        this.unregisterPluginScanner(scanner);
        this._pluginScanners.push(scanner);
        scanner.setCallback({
            addOrUpdatePackageURL: (url) => this._addOrUpdatePackageURL(scanner.name, url),
            removePackageURL: (url) => this._removePackageURL(scanner.name, url),
        });
        if (this._started) {
            (async () => {
                try {
                    this._logger.info(`Starting plugin scanner: ${scanner.name}`);
                    await scanner.start();
                } catch (e) {
                    this._logger.warn(`Scanner '${scanner.name}' threw an error on start`, e);
                }
            })();
        }
    }

    unregisterPluginScanner(scanner: MashroomPluginPackageScanner) {
        const existingScanner =  this._pluginScanners.find((s) => s === scanner);
        if (existingScanner) {
            this._pluginScanners = this._pluginScanners.filter((s) => s !== scanner);
            this._logger.info(`Starting plugin scanner: ${existingScanner.name}`);
            existingScanner.stop();
        }
    }

    registerPluginDefinitionBuilder(weight: number, definitionBuilder: MashroomPluginPackageDefinitionBuilder) {
        this.unregisterPluginDefinitionBuilder(definitionBuilder);
        this._pluginDefinitionBuilders.push({
            weight,
            definitionBuilder,
        });
    }

    unregisterPluginDefinitionBuilder(definitionBuilder: MashroomPluginPackageDefinitionBuilder) {
        this._pluginDefinitionBuilders = this._pluginDefinitionBuilders.filter((b) => b.definitionBuilder !== definitionBuilder);
    }

    private async _addOrUpdatePackageURL(scannerName: string, url: URL) {
        let potentialPackage = this._potentialPackages.find(pu => pu.url.toString() === url.toString());
        if (!potentialPackage) {
            this._logger.debug(`Adding potential package URL: ${url}`);
            potentialPackage = {
                url,
                scannerName,
                pluginPackageDefinition: null,
                pluginPackage: null,
                plugins: null,
            };
            this._potentialPackages.push(potentialPackage);
        }

        // Allow hot reload
        if (url.protocol === 'file:') {
            removePackageModulesFromNodeCache(fileURLToPath(url));
        }

        const packageDefinitionAndMeta = await this._buildPackageDefinition(url);
        if (!packageDefinitionAndMeta) {
            this._logger.debug(`No plugin package definition found for URL: ${url}`);
            if (potentialPackage.plugins) {
                potentialPackage.plugins.forEach((plugin) => this._unloadPlugin(potentialPackage, plugin));
            }
            potentialPackage.pluginPackageDefinition = null;
            potentialPackage.pluginPackage = null;
            potentialPackage.plugins = null;
            return;
        }

        // Create plugin package
        let fixedPluginDefinition = packageDefinitionAndMeta.definition;
        let error: string | undefined;
        try {
            fixedPluginDefinition = fixAndValidatePluginPackageDefinition(url, fixedPluginDefinition, packageDefinitionAndMeta.meta, this._logger);
        } catch (e: any) {
            this._logger.error(`Plugin package definition validation failed for ${url}. Error: ${e.message}`, e);
            error = e.message;
        }

        const pluginPackage = new MashroomPluginPackageImpl(url, fixedPluginDefinition, packageDefinitionAndMeta.meta);
        potentialPackage.pluginPackage = pluginPackage;

        if (error) {
            pluginPackage.setStatus('error');
            pluginPackage.setErrorMessage(error);
            return;
        }

        await this._buildPackage(pluginPackage);
    }

    private _removePackageURL(scannerName: string, url: URL) {
        const potentialPackage = this._potentialPackages.find((pp) => pp.url.toString() === url.toString());
        if (!potentialPackage) {
            return;
        }
        if (potentialPackage.plugins) {
            potentialPackage.plugins.forEach((plugin) => this._unloadPlugin(potentialPackage, plugin));
        }
        this._potentialPackages = this._potentialPackages.filter((pp) => pp !== potentialPackage);

        // Cleanup
        if (url.protocol === 'file:') {
            removePackageModulesFromNodeCache(fileURLToPath(url));
        }
    }

    private async _buildPackageDefinition(url: URL): Promise<MashroomPluginPackageDefinitionAndMeta | null> {
        const sortedBuilders = this._pluginDefinitionBuilders
            .sort((a, b) => b.weight - a.weight)
            .map((b) => b.definitionBuilder);
        for (let builder of sortedBuilders) {
            try {
                const defAndMeta = await builder.buildDefinition(url);
                if (defAndMeta) {
                    return defAndMeta;
                }
            } catch (e) {
                this._logger.error(`Package definition builder '${builder.name}' threw an error!`, e);
            }
        }
        return null;
    }

    private async _buildPackage(pluginPackage: MashroomPluginPackageImpl) {
        const pluginPackagePath = fileURLToPath(pluginPackage.pluginPackageURL);
        if (this._builder && pluginPackage.devModeBuildScript && this._isPackageInDevMode(pluginPackage.pluginPackageURL)) {
            pluginPackage.setStatus('building');
            pluginPackage.setErrorMessage(null);
            this._builder.addToBuildQueue(pluginPackage.name, pluginPackagePath, pluginPackage.devModeBuildScript);
        } else {
           this._onBuildPackageFinished({
               pluginPackageName: pluginPackage.name,
               success: true,
           });
        }
    }

    private async _onBuildPackageFinished(event: MashroomPluginPackageBuilderEvent) {
        const potentialPackage = this._potentialPackages.find((pp) => pp.pluginPackage?.name === event.pluginPackageName);
        if (!potentialPackage) {
            this._logger.warn(`Plugin package build finished for unknown package: ${event.pluginPackageName}`);
            return;
        }
        const pluginPackage = potentialPackage.pluginPackage as MashroomPluginPackageImpl;
        if (!event.success) {
            this._logger.error(`Plugin package build failed: ${event.pluginPackageName}. Error: ${event.errorMessage}`);
            pluginPackage.setStatus('error');
            pluginPackage.setErrorMessage(event.errorMessage ?? 'Build failed');
            return;
        }

        this._logger.debug(`Plugin package build finished: ${event.pluginPackageName}`);
        pluginPackage.setStatus('ready');
        pluginPackage.setErrorMessage(null);

        let pluginDefinitions = pluginPackage.pluginDefinitions;

        // Check the ignore list
        const ignorePlugins = this._pluginContextHolder.getPluginContext().serverConfig.ignorePlugins;
        if (ignorePlugins && ignorePlugins.length > 0) {
            pluginDefinitions = pluginDefinitions.filter((p) => {
                if (ignorePlugins.indexOf(p.name) !== -1) {
                    this._logger.info(`Ignoring plugin '${p.name}' because it's on the ignore list`);
                    return false;
                }

                return true;
            });
        }

        const plugins = pluginDefinitions.map((pd) => new MashroomPluginImpl(pd, pluginPackage, this._loggerFactory));
        for (const plugin of plugins) {
            await this._loadPlugin(potentialPackage, plugin);
        }
    }

    private async _loadPlugin(potentialPackage: PotentialPackage, plugin: MashroomPluginImpl) {
        const existing = this._findPlugin(plugin.name);
        if (existing) {
            const [existingPluginPackage, existingPlugin] = existing;
            if (existingPluginPackage.url.toString() !== plugin.pluginPackage.pluginPackageURL.toString()) {
                plugin.setStatus('error');
                plugin.setErrorMessage(`Duplicate plugin name. A plugin with name '${plugin.name}' also exists in ${existingPlugin.pluginPackage.pluginPackageURL}`);
                return;
            }

            await this._unloadPlugin(existingPluginPackage, existingPlugin);
        }

        // Add to the package, if necessary
        if (!potentialPackage.plugins?.find((p) => p.name === plugin.name)) {
            if (!potentialPackage.plugins) {
                potentialPackage.plugins = [];
            }
            potentialPackage.plugins.push(plugin);
        }

        const loader = this._pluginLoaders[plugin.type];
        if (!loader) {
            this._logger.info(`No loader found for plugin: ${plugin.name}, type: ${plugin.type}`);
            plugin.setStatus('error');
            plugin.setErrorMessage(`No loader found for type: ${plugin.type}`);
            if (this._pluginsNoLoader.indexOf(plugin) === -1) {
                this._pluginsNoLoader.push(plugin);
            }
            return;
        }

        const missingPlugins = [];
        const requires = plugin.pluginDefinition.requires;
        if (requires && Array.isArray(requires)) {
            const loadedPluginNames = this.plugins
                .filter((p) => p.status === 'loaded')
                .map((p) => p.name);
            for (const requiredPluginName of requires) {
                if (loadedPluginNames.indexOf(requiredPluginName) === -1) {
                    missingPlugins.push(requiredPluginName);
                }
            }
        }

        if (missingPlugins.length > 0) {
            this._logger.info(`Some required plugins are missing for plugin: ${plugin.name}: ${missingPlugins.join(', ')}. Try to reload later.`);
            plugin.setStatus('error');
            plugin.setErrorMessage(`Missing required plugins: ${missingPlugins.join(', ')}`);
            if (this._pluginsMissingRequirements.indexOf(plugin) === -1) {
                this._pluginsMissingRequirements.push(plugin);
            }
            return;
        }

        try {
            const pluginConfig = createPluginConfig(plugin, loader, this._pluginContextHolder.getPluginContext());

            this._logger.debug(`Loading plugin: ${plugin.name}, type: ${plugin.type}`);
            await loader.load(plugin, pluginConfig, this._pluginContextHolder);
            plugin.setConfig(pluginConfig);
            plugin.setStatus('loaded');
            plugin.setErrorMessage(null);
            this._eventEmitter.emit('loaded', {
                pluginName: plugin.name,
            });

            // After loading this plugin we might be able to load other Plugins with missing requirements
            await this._checkPluginsMissingRequirements();

        } catch (error: any) {
            this._logger.error(`Loading plugin: ${plugin.name}, type: ${plugin.type} failed!`, error);
            plugin.setStatus('error');
            plugin.setErrorMessage(`Loading failed (${error.toString()}`);
        }
    }

    private async _unloadPlugin(potentialPackage: PotentialPackage, plugin: MashroomPlugin) {
        if (plugin.status !== 'loaded') {
            return;
        }

        const loader = this._pluginLoaders[plugin.type];
        if (!loader) {
            this._logger.info(`No loader found for plugin: ${plugin.name}, type: ${plugin.type}. Cannot unload!`);
            return;
        }

        potentialPackage.plugins = potentialPackage.plugins!.filter((p) => p.name !== plugin.name);

        try {
            this._logger.debug(`Unloading plugin: ${plugin.name}, type: ${plugin.type}`);
            await loader.unload(plugin);
            this._eventEmitter.emit('unloaded', {
                pluginName: plugin.name,
            });
        } catch (error) {
            this._logger.error(`Unloading plugin: ${plugin.name}, type: ${plugin.type} failed!`, error);
        }
    }

    private _findPlugin(name: string): [PotentialPackage, MashroomPluginImpl] | null {
        const potentialPackage = this._potentialPackages.find((pp) => pp.plugins?.find((p) => p.name === name));
        if (!potentialPackage) {
            return null;
        }
        const plugin = potentialPackage.plugins!.find((p) => p.name === name)!;
        return [potentialPackage, plugin];
    }

    private _findLoadedPluginsByType(type: MashroomPluginType): Array<MashroomPlugin> {
        return this.plugins.filter((p) => p.type === type && p.status === 'loaded');
    }

    private async _reRegisterLoadedPlugins(pluginType: MashroomPluginType) {
        const loadedPlugins = this._findLoadedPluginsByType(pluginType);
        if (loadedPlugins.length > 0) {
            this._logger.debug(`Re-registering loaded plugins of type ${String(pluginType)}`, loadedPlugins);
            for (let i = 0; i < loadedPlugins.length; i++) {
                const plugin = loadedPlugins[i];
                const [potentialPackage, pluginImpl] = this._findPlugin(plugin.name)!;
                await this._loadPlugin(potentialPackage, pluginImpl);
            }
        }
    }

    private async _checkPluginsNoLoader() {
        const unloadedPlugins = [...this._pluginsNoLoader];
        for (const unloadedPlugin of unloadedPlugins) {
            if (this._pluginsNoLoader.indexOf(unloadedPlugin) === -1) {
                // If the re-load of a plugin takes a long time another call of
                // _checkPluginsNoLoader() could have loaded this already
                continue;
            }
            this._removeFromPluginsNoLoader(unloadedPlugin);

            const [potentialPackage, pluginImpl] = this._findPlugin(unloadedPlugin.name)!;
            await this._loadPlugin(potentialPackage, pluginImpl);
        }
    }

    private async _checkPluginsMissingRequirements() {
        const unloadedPlugins = [...this._pluginsMissingRequirements];
        for (const unloadedPlugin of unloadedPlugins) {
            if (this._pluginsMissingRequirements.indexOf(unloadedPlugin) === -1) {
                // If the reload of a plugin takes a long time another call of
                // __checkPluginsMissingRequirements() could have loaded this already
                continue;
            }
            this._removeFromPluginsMissingRequirements(unloadedPlugin);

            this._logger.info(`Retry to load plugin with missing requirements: ${unloadedPlugin.name}`);
            const [potentialPackage, pluginImpl] = this._findPlugin(unloadedPlugin.name)!;
            await this._loadPlugin(potentialPackage, pluginImpl);
        }

        // When we were able to load plugins with missing requirements,
        // they might fulfill the requirements of other plugins now
        if (unloadedPlugins.length > this._pluginsMissingRequirements.length) {
            await this._checkPluginsMissingRequirements();
        }
    }

    private _removeFromPluginsNoLoader(plugin: MashroomPlugin) {
        const idx = this._pluginsNoLoader.indexOf(plugin);
        if (idx !== -1) {
            this._pluginsNoLoader.splice(idx, 1);
        }
    }

    private _removeFromPluginsMissingRequirements(plugin: MashroomPlugin) {
        const idx = this._pluginsMissingRequirements.indexOf(plugin);
        if (idx !== -1) {
            this._pluginsMissingRequirements.splice(idx, 1);
        }
    }

    private _isPackageInDevMode(packageURL: URL): boolean {
        if (packageURL.protocol !== 'file:') {
            return false;
        }
        const packagePath = fileURLToPath(packageURL);
        return this._pluginContextHolder.getPluginContext().serverConfig
            .pluginPackageFolders.some((ppf) => packagePath.indexOf(ppf.path) === 0 && !!ppf.devMode);
    }
}
