import {fileURLToPath} from 'url';
import {EventEmitter} from 'events';
import {readonlyUtils} from '@mashroom/mashroom-utils';
import {createPluginConfig} from '../utils/plugin-utils';
import {removePackageModulesFromNodeCache} from '../utils/reload-utils';
import DefinitionBuilderError from '../errors/DefinitionBuilderError';
import fixAndValidatePluginPackageDefinition from './validation/fixAndValidatePluginPackageDefinition';
import MashroomPluginPackageImpl from './MashroomPluginPackage';
import MashroomPluginImpl from './MashroomPlugin';
import type {
    MashroomLogger,
    MashroomPluginContextHolder,
    MashroomPluginPackageDefinitionBuilder,
    MashroomPluginLoader,
    MashroomPluginLoaderMap,
    MashroomPluginPackageScanner,
    MashroomPluginPackage,
    MashroomPlugin,
    MashroomPluginPackageDefinitionAndMeta,
    MashroomPluginType,
    MashroomLoggerFactory,
    MashroomPluginScannerHints,
    MashroomPotentialPluginPackage,
} from '../../type-definitions';
import type {URL} from 'url';
import type {
    MashroomPluginPackageBuilder,
    MashroomPluginPackageBuilderEvent,
    MashroomPluginRegistry,
    MashroomPluginManager as MashroomPluginManagerType,
    MashroomPluginRegistryEvent,
    MashroomPluginRegistryEventName,
    MashroomPluginPackageDefinitionBuilderWithOrder,
} from '../../type-definitions/internal';

type InternalPotentialPackage = {
    readonly url: URL;
    readonly scannerName: string;
    definitionBuilderName: string | null;
    processedOnce: boolean;
    status: 'processing' | 'processed';
    lastUpdate: number;
    updateErrors: Array<string> | null;
    updateRetries: number;
    scannerHints: MashroomPluginScannerHints;
    pluginPackages: Array<MashroomPluginPackageImpl> | null;
    plugins: Array<MashroomPluginImpl> | null;
}

type InternalPluginPackageDefinitionAndMeta = {
    readonly definitionBuilderName: string;
    readonly defAndMetas: Array<MashroomPluginPackageDefinitionAndMeta>;
}

export default class MashroomPluginManager implements MashroomPluginManagerType, MashroomPluginRegistry {

    private _started = false;
    private _potentialPackages: Array<InternalPotentialPackage>;
    private readonly _pluginLoaders: MashroomPluginLoaderMap;
    private _pluginScanners: Array<MashroomPluginPackageScanner>;
    private _pluginDefinitionBuilders: Array<MashroomPluginPackageDefinitionBuilderWithOrder>;
    private readonly _pluginsNoLoader: Array<MashroomPlugin>;
    private readonly _pluginsMissingRequirements: Array<MashroomPlugin>;
    private readonly _eventEmitter: EventEmitter;
    private readonly _logger: MashroomLogger;
    private _retryInterval: NodeJS.Timeout | undefined;

    constructor(private _pluginContextHolder: MashroomPluginContextHolder, private _loggerFactory: MashroomLoggerFactory,
                private _builder: MashroomPluginPackageBuilder | undefined | null,
                private _retryIntervalMs = 5000, private _maxRetries = 3) {
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
        if (this._retryIntervalMs > 0 && this._maxRetries > 0) {
            this._retryInterval = setInterval(() => this._retryPotentialPackagesWithErrors(), this._retryIntervalMs);
        }
        this._started = true;
    }

    async stop() {
        this._started = false;
        if (this._retryInterval) {
            clearInterval(this._retryInterval);
        }
        for (let scanner of this._pluginScanners) {
            try {
                this._logger.info(`Stopping plugin scanner: ${scanner.name}`);
                await scanner.stop();
            } catch (e) {
                this._logger.warn(`Scanner '${scanner.name}' threw an error on stop`, e);
            }
        }
    }

    get potentialPluginPackages(): Readonly<Array<MashroomPotentialPluginPackage>> {
        return readonlyUtils.cloneAndFreezeArray(this._potentialPackages
            .map(({url, scannerName, definitionBuilderName, processedOnce, status, lastUpdate, updateErrors, plugins}) => ({
                url,
                scannerName,
                definitionBuilderName,
                processedOnce,
                status,
                lastUpdate,
                updateErrors,
                foundPlugins: plugins?.map((p) => p.name) ?? null,
            }))
        );
    }

    get pluginPackages(): Readonly<Array<MashroomPluginPackage>> {
        return readonlyUtils.cloneAndFreezeArray(this._potentialPackages
            .flatMap((p) => p.pluginPackages).filter((p) => !!p));
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
        (async () => {
            await this._reRegisterLoadedPlugins(type);
            await this._checkPluginsNoLoader();
        })();
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
            addOrUpdatePackageUrl: (url, hints) => this._addOrUpdatePackageUrl(scanner.name, url, hints),
            removePackageUrl: (url) => this._removePackageUrl(url),
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

    registerPluginDefinitionBuilder(order: number, definitionBuilder: MashroomPluginPackageDefinitionBuilder) {
        this.unregisterPluginDefinitionBuilder(definitionBuilder);
        this._pluginDefinitionBuilders.push({
            order,
            definitionBuilder,
        });
        // This definition builder might now be able to build definitions of plugin packages
        (async () => {
            await this._checkPluginPackagesNoDefinitionBuilderFound();
        })();
    }

    unregisterPluginDefinitionBuilder(definitionBuilder: MashroomPluginPackageDefinitionBuilder) {
        this._pluginDefinitionBuilders = this._pluginDefinitionBuilders.filter((b) => b.definitionBuilder !== definitionBuilder);
    }

    private async _addOrUpdatePackageUrl(scannerName: string, url: URL, scannerHints: Record<string, any> = {}) {
        let potentialPackage = this._potentialPackages.find(pu => pu.url.toString() === url.toString());
        if (potentialPackage?.status === 'processing') {
            // Already processing, ignore this updated
            return;
        }

        if (potentialPackage) {
            this._logger.debug(`Updating potential package URL: ${url}`);
        } else {
            this._logger.debug(`Adding new potential package URL: ${url}`);
            potentialPackage = {
                url,
                scannerName,
                definitionBuilderName: null,
                lastUpdate: Date.now(),
                processedOnce: false,
                status: 'processing',
                updateErrors: null,
                updateRetries: 0,
                scannerHints,
                pluginPackages: null,
                plugins: null,
            };
            this._potentialPackages.push(potentialPackage);
        }

        await this._updatePackage(potentialPackage);
    }

    private _removePackageUrl(url: URL) {
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

    private async _updatePackage(potentialPackage: InternalPotentialPackage) {
        potentialPackage.lastUpdate = Date.now();
        potentialPackage.updateErrors = null;
        potentialPackage.status = 'processing';

        // Allow hot reload
        if (potentialPackage.url.protocol === 'file:') {
            removePackageModulesFromNodeCache(fileURLToPath(potentialPackage.url));
        }

        let buildPackageDefinitionResult;
        try {
            buildPackageDefinitionResult = await this._buildPackageDefinition(potentialPackage.url, potentialPackage.scannerHints);
        } catch (e: any) {
            // Building the package definition failed, this might be a temporary problem; we just keep all plugins
            let message = e.message;
            if (e.name === 'DefinitionBuilderError') {
                const dbe = e as DefinitionBuilderError;
                potentialPackage.updateErrors = dbe.getErrors();
                message = dbe.getErrors().join(', ');
            } else {
                potentialPackage.updateErrors = [message];
            }
            potentialPackage.updateRetries ++;
            potentialPackage.status = 'processed';
            potentialPackage.processedOnce = true;
            this._logger.error(`Plugin package definition validation failed for ${potentialPackage.url}. Error: ${message}`);
            return;
        }

        if (!buildPackageDefinitionResult) {
            this._logger.debug(`No plugin package definition found for URL: ${potentialPackage.url}`);
            if (potentialPackage.plugins) {
                potentialPackage.plugins.forEach((plugin) => this._unloadPlugin(potentialPackage, plugin));
            }
            potentialPackage.status = 'processed';
            potentialPackage.processedOnce = true;
            potentialPackage.updateErrors = null;
            potentialPackage.updateRetries = 0;
            potentialPackage.definitionBuilderName = null;
            potentialPackage.pluginPackages = null;
            potentialPackage.plugins = null;
            return;
        }

        potentialPackage.definitionBuilderName = buildPackageDefinitionResult.definitionBuilderName;

        // Process all found packages
        const currentPluginPackages = potentialPackage.pluginPackages;
        potentialPackage.pluginPackages = [];
        for (const packageDefinitionAndMeta of buildPackageDefinitionResult.defAndMetas) {
            // If this is a remote package and the version didn't change, do nothing (optimization)
            if (packageDefinitionAndMeta.packageUrl.protocol !== 'file:') {
                const currentPluginPackage = currentPluginPackages?.find(({ name, pluginPackageUrl }) =>
                    name === packageDefinitionAndMeta.meta.name && pluginPackageUrl.toString() === packageDefinitionAndMeta.packageUrl.toString());
                if (currentPluginPackage?.version === packageDefinitionAndMeta.meta.version) {
                    this._logger.debug(`Ignoring update of package ${packageDefinitionAndMeta.packageUrl}, because version didn't change.`);
                    potentialPackage.pluginPackages.push(currentPluginPackage);
                    continue;
                }
            }

            let fixedPluginDefinition = packageDefinitionAndMeta.definition;
            let error: string | undefined;
            try {
                fixedPluginDefinition = fixAndValidatePluginPackageDefinition(potentialPackage.url, fixedPluginDefinition, packageDefinitionAndMeta.meta, this._logger);
            } catch (e: any) {
                this._logger.error(`Plugin package definition validation failed for ${potentialPackage.url}. Error: ${e.message}`, e);
                error = e.message;
            }

            // Remove no longer existing plugins
            if (potentialPackage.plugins) {
                potentialPackage.plugins.forEach((plugin) => {
                    if (!fixedPluginDefinition.plugins.find((p) => p.name === plugin.name)) {
                        this._unloadPlugin(potentialPackage, plugin);
                    }
                });
            }

            const pluginPackage = new MashroomPluginPackageImpl(packageDefinitionAndMeta.packageUrl ?? potentialPackage.url,
                fixedPluginDefinition, packageDefinitionAndMeta.meta);
            potentialPackage.pluginPackages.push(pluginPackage);

            if (error) {
                pluginPackage.setStatus('error');
                pluginPackage.setErrorMessage(error);
                continue;
            }

            await this._buildPackage(pluginPackage);
        }

        this._isPotentialPackageProcessed(potentialPackage);
    }

    private async _buildPackageDefinition(url: URL, scannerHints: MashroomPluginScannerHints): Promise<InternalPluginPackageDefinitionAndMeta | null> {
        const sortedBuilders = this._pluginDefinitionBuilders
            .sort((a, b) => b.order - a.order)
            .map((b) => b.definitionBuilder);
        const errors: Array<string> = [];
        for (let builder of sortedBuilders) {
            try {
                const defAndMetas = await builder.buildDefinition(url, scannerHints);
                if (defAndMetas) {
                    this._logger.debug(`Package definition builder '${builder.name}' found ${defAndMetas.length} packages for ${url}`);
                    return {
                        definitionBuilderName: builder.name,
                        defAndMetas,
                    };
                }
            } catch (e: any) {
                if (typeof e.cause === 'object') {
                    // eslint-disable-next-line no-ex-assign
                    e = e.cause;
                }
                let errorMessage;
                if (e.code) {
                    errorMessage = e.code;
                } else {
                    errorMessage = e.message;
                }
                errors.push(errorMessage);
                this._logger.warn(`Package definition builder '${builder.name}' threw an error!`, e);
            }
        }
        if (errors.length > 0) {
            throw new DefinitionBuilderError(`Package definition building failed for ${url}`, errors);
        }
        return null;
    }

    private async _buildPackage(pluginPackage: MashroomPluginPackageImpl) {
        if (this._builder && pluginPackage.devModeBuildScript && this._isPackageInDevMode(pluginPackage.pluginPackageUrl)) {
            const pluginPackagePath = fileURLToPath(pluginPackage.pluginPackageUrl);
            pluginPackage.setStatus('building');
            pluginPackage.setErrorMessage(null);
            this._builder.addToBuildQueue(pluginPackage.name, pluginPackagePath, pluginPackage.devModeBuildScript);
        } else {
           await this._onBuildPackageFinished({
               pluginPackageName: pluginPackage.name,
               success: true,
           });
        }
    }

    private async _onBuildPackageFinished(event: MashroomPluginPackageBuilderEvent) {
        const potentialPackage = this._potentialPackages.find((pp) => pp.pluginPackages?.find(({name}) => name === event.pluginPackageName));
        if (!potentialPackage) {
            this._logger.warn(`Plugin package build finished for unknown package: ${event.pluginPackageName}`);
            return;
        }
        const pluginPackage = potentialPackage.pluginPackages!.find(({name}) => name === event.pluginPackageName) as MashroomPluginPackageImpl;
        if (!event.success) {
            this._logger.error(`Plugin package build failed: ${event.pluginPackageName}. Error: ${event.errorMessage}`);
            pluginPackage.setStatus('error');
            pluginPackage.setErrorMessage(event.errorMessage ?? 'Build failed');
            this._isPotentialPackageProcessed(potentialPackage);
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

        this._isPotentialPackageProcessed(potentialPackage);
    }

    private async _loadPlugin(potentialPackage: InternalPotentialPackage, plugin: MashroomPluginImpl) {
        const existing = this._findPlugin(plugin.name);
        if (existing) {
            const [existingPluginPackage, existingPlugin] = existing;
            if (existingPluginPackage.url.toString() !== plugin.pluginPackage.pluginPackageUrl.toString()) {
                plugin.setStatus('error');
                plugin.setErrorMessage(`Duplicate plugin name. A plugin with name '${plugin.name}' also exists in ${existingPlugin.pluginPackage.pluginPackageUrl}`);
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
            plugin.setLastReloadTs(Date.now());
            plugin.setStatus('loaded');
            plugin.setErrorMessage(null);
            this._eventEmitter.emit('loaded', {
                pluginName: plugin.name,
            });

            // After loading this plugin, we might be able to load other Plugins with missing requirements
            await this._checkPluginsMissingRequirements();

        } catch (error: any) {
            this._logger.error(`Loading plugin: ${plugin.name}, type: ${plugin.type} failed!`, error);
            plugin.setStatus('error');
            plugin.setErrorMessage(`Loading failed (${error.toString()}`);
        }
    }

    private async _unloadPlugin(potentialPackage: InternalPotentialPackage, plugin: MashroomPlugin) {
        this._logger.debug(`Removing plugin: ${plugin.name}, type: ${plugin.type}`);
        potentialPackage.plugins = potentialPackage.plugins!.filter((p) => p.name !== plugin.name);

        if (plugin.status !== 'loaded') {
            return;
        }

        const loader = this._pluginLoaders[plugin.type];
        if (!loader) {
            this._logger.info(`No loader found for plugin: ${plugin.name}, type: ${plugin.type}. Cannot unload!`);
            return;
        }

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

    private _findPlugin(name: string): [InternalPotentialPackage, MashroomPluginImpl] | null {
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
                // If the reload of a plugin takes a long time, another call of
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

    private _isPotentialPackageProcessed(potentialPackage: InternalPotentialPackage) {
        if (potentialPackage.status === 'processing') {
            const stillProcessing = potentialPackage.pluginPackages?.some((pp) => pp.status === 'pending' || pp.status === 'building');
            if (!stillProcessing) {
                potentialPackage.status = 'processed';
                potentialPackage.processedOnce = true;
                potentialPackage.updateErrors = null;
                potentialPackage.updateRetries = 0;
            }
        }
    }

    private _isPackageInDevMode(packageUrl: URL): boolean {
        if (packageUrl.protocol !== 'file:') {
            return false;
        }
        const packagePath = fileURLToPath(packageUrl);
        return this._pluginContextHolder.getPluginContext().serverConfig
            .pluginPackageFolders.some((ppf) => packagePath.indexOf(ppf.path) === 0 && !!ppf.devMode);
    }

    private async _checkPluginPackagesNoDefinitionBuilderFound() {
        const potentialPackagesNotDefinition = this._potentialPackages.filter((pp) =>
            pp.processedOnce && !pp.definitionBuilderName && !pp.plugins);
        for (const potentialPackage of potentialPackagesNotDefinition) {
            this._logger.info(`Retrying building definition for package ${potentialPackage.url}`);
            await this._updatePackage(potentialPackage);
        }
    }

    private async _retryPotentialPackagesWithErrors() {
        for (const potentialPackage of this._potentialPackages) {
            if (potentialPackage.updateErrors && potentialPackage.updateRetries < this._maxRetries) {
                this._logger.info(`Retrying building definition for package ${potentialPackage.url} - attempt #${potentialPackage.updateRetries + 1}`);
                await this._updatePackage(potentialPackage);
            }
        }
    }
}
