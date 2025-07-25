import {fileURLToPath, pathToFileURL} from 'url';
import {readonlyUtils, configUtils} from '@mashroom/mashroom-utils';
import {createPluginConfig} from '../utils/plugin-utils';
import MashroomPluginPackageImpl from './MashroomPluginPackage';
import MashroomPluginImpl from './MashroomPlugin';
import type { URL} from 'url';
import type {
    MashroomLogger,
    MashroomLoggerFactory,
    MashroomPluginContextHolder,
    MashroomPluginPackageDefinitionBuilder,
    MashroomPluginLoader,
    MashroomPluginLoaderMap,
    MashroomPluginPackageDefinition,
    MashroomPluginPackageScanner,
    MashroomPluginPackage,
    MashroomPlugin,
    MashroomPluginPackageDefinitionAndMeta,
    MashroomPluginType, MashroomPluginDefinition, MashroomPluginPackageMeta,
} from '../../type-definitions';
import type {
    MashroomPluginPackageBuilder,
    MashroomPluginPackageBuilderEvent,
    MashroomPluginRegistry
} from '../../type-definitions/internal';

type PotentialPackage = {
    readonly url: URL;
    readonly scannerName: string;
    pluginPackageDefinition: MashroomPluginPackageDefinition | null;
    pluginPackage: MashroomPluginPackageImpl | null;
    plugins: Array<MashroomPluginImpl> | null;
}

type PluginScanner = {
    readonly name: string;
    readonly scanner: MashroomPluginPackageScanner;
}

type PluginDefinitionBuilder = {
    readonly weight: number;
    readonly definitionBuilder: MashroomPluginPackageDefinitionBuilder;
}

export default class MashroomPluginManager implements MashroomPluginRegistry {

    private _potentialPackages: Array<PotentialPackage>;
    private readonly _pluginLoaders: MashroomPluginLoaderMap;
    private _pluginScanners: Array<PluginScanner>;
    private _pluginDefinitionBuilders: Array<PluginDefinitionBuilder>;
    private readonly _pluginsNoLoader: Array<MashroomPlugin>;
    private readonly _pluginsMissingRequirements: Array<MashroomPlugin>;
    private readonly _logger: MashroomLogger;

    constructor(private _ignorePlugins: Array<string>, private _builder: MashroomPluginPackageBuilder | undefined | null,
                private _pluginContextHolder: MashroomPluginContextHolder, private _loggerFactory: MashroomLoggerFactory) {
        this._logger = _loggerFactory('mashroom.plugins.registry');
        this._potentialPackages = [];
        this._pluginLoaders = {};
        this._pluginScanners = [];
        this._pluginDefinitionBuilders = [];
        this._pluginsNoLoader = [];
        this._pluginsMissingRequirements = [];

        if (this._builder) {
            this._builder.on('build-finished', this._onBuildPackageFinished.bind(this));
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

    registerPluginScanner(name: string, scanner: MashroomPluginPackageScanner) {
        this.unregisterPluginScanner(scanner);
        this._pluginScanners.push({
            name,
            scanner,
        });
        scanner.setCallback({
            addOrUpdatePackageURL: (url) => this._addOrUpdatePackageURL(name, url),
            removePackageURL: (url) => this._removePackageURL(name, url),
        });
        this._logger.info(`Starting plugin scanner: ${name}`);
        scanner.start();
    }

    unregisterPluginScanner(scanner: MashroomPluginPackageScanner) {
        const existingScanner =  this._pluginScanners.find((s) => s.scanner === scanner);
        if (existingScanner) {
            this._pluginScanners = this._pluginScanners.filter((s) => s.scanner !== scanner);
            this._logger.info(`Starting plugin scanner: ${existingScanner.name}`);
            existingScanner.scanner.stop();
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
            this._logger.debug(`Adding potential package URL: ${url.toString()}`);
            potentialPackage = {
                url,
                scannerName,
                pluginPackageDefinition: null,
                pluginPackage: null,
                plugins: null,
            };
            this._potentialPackages.push(potentialPackage);
        }

        const packageDefinitionAndMeta = await this._buildPackageDefinition(url);
        if (!packageDefinitionAndMeta) {
            this._logger.debug(`No plugin package definition found for URL: ${url.toString()}`);
            if (potentialPackage.plugins) {
                potentialPackage.plugins.forEach((plugin) => this._unloadPlugin(potentialPackage, plugin));
            }
            potentialPackage.pluginPackageDefinition = null;
            potentialPackage.pluginPackage = null;
            potentialPackage.plugins = null;
            return;
        }

        const pluginPackage = new MashroomPluginPackageImpl(url, packageDefinitionAndMeta.definition,
            this._checkPluginPackageMeta(url, packageDefinitionAndMeta.meta), this._loggerFactory);
        potentialPackage.pluginPackage = pluginPackage;

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
    }

    private async _buildPackageDefinition(url: URL): Promise<MashroomPluginPackageDefinitionAndMeta | null> {
        const sortedBuilders = this._pluginDefinitionBuilders
            .sort((a, b) => a.weight - b.weight)
            .map((b) => b.definitionBuilder);
        for (let builder of sortedBuilders) {
            try {
                const defAndMeta = await builder.buildDefinition(url);
                if (defAndMeta) {
                    return defAndMeta;
                }
            } catch (e) {
                this._logger.error('Error building plugin package definition', e);
            }
        }
        return null;
    }

    private async _buildPackage(pluginPackage: MashroomPluginPackageImpl) {
        const pluginPackagePath = fileURLToPath(pluginPackage.pluginPackageURL);
       if (this._builder && pluginPackage.devModeBuildScript && pluginPackage.pluginPackageURL.protocol === 'file:') {
           pluginPackage.setStatus('building');
           pluginPackage.setErrorMessage(null);
           this._builder.addToBuildQueue(pluginPackage.name, pluginPackagePath, pluginPackage.devModeBuildScript);
       } else {
           this._onBuildPackageFinished({
               pluginPackagePath,
               success: true,
           });
       }
    }

    private async _onBuildPackageFinished(event: MashroomPluginPackageBuilderEvent) {
        const pluginPackageURL = pathToFileURL(event.pluginPackagePath);
        const potentialPackage = this._potentialPackages.find((pp) => pp.url.toString() === pluginPackageURL.toString());
        if (!potentialPackage) {
            this._logger.warn(`Plugin package build finished for unknown package: ${pluginPackageURL}`);
            return;
        }
        const pluginPackage = potentialPackage.pluginPackage as MashroomPluginPackageImpl;
        if (!event.success) {
            this._logger.error(`Plugin package build failed: ${pluginPackageURL}. Error: ${event.errorMessage}`);
            pluginPackage.setStatus('error');
            pluginPackage.setErrorMessage(event.errorMessage ?? 'Build failed');
            return;
        }

        this._logger.debug(`Plugin package build finished: ${pluginPackageURL}`);
        pluginPackage.setStatus('ready');
        pluginPackage.setErrorMessage(null);

        let pluginDefinitions = this._checkPluginDefinitions(pluginPackage);

        // Check the ignore list
        if (this._ignorePlugins && this._ignorePlugins.length > 0) {
            pluginDefinitions = pluginDefinitions.filter((p) => {
                if (this._ignorePlugins.indexOf(p.name) !== -1) {
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

    private _checkPluginPackageMeta(pluginPackageURL: URL, pluginPackageMeta: MashroomPluginPackageMeta): MashroomPluginPackageMeta {
        const meta: any = {
            ...pluginPackageMeta,
        };

        if (!meta.name) {
            meta.name = pluginPackageURL.toString();
        }
        if (!meta.version) {
            this._logger.error(`No version found for package ${pluginPackageURL}. Using 0.0.0`);
            meta.version = '0.0.0';
        }

        return meta;
    }

    private _checkPluginDefinitions(pluginPackage: MashroomPluginPackage): Array<MashroomPluginDefinition> {
        const packageName = pluginPackage.name ?? pluginPackage.pluginPackageURL.toString();
        const rawPluginDefinitions = pluginPackage.pluginDefinitions;

        const fixedPluginDefinitions = rawPluginDefinitions
            .filter((pd) => {
                if (!pd.name) {
                    this._logger.error(`Ignoring plugin in package ${packageName} because it has no name property.`);
                    return false;
                }
                if (pd.name.match(configUtils.INVALID_PLUGIN_NAME_CHARACTERS)) {
                    this._logger.error(`Ignoring plugin ${pd.name} in package ${packageName} because its name has invalid characters (/,?).`);
                    return false;
                }
                if (!pd.type) {
                    this._logger.error(`Ignoring plugin ${pd.name} in package ${packageName} because it has no type property.`);
                    return false;
                }

                return true;
            })
            .map((pd) => ({
                ...pd,
            }));

        // Fix description
        fixedPluginDefinitions.forEach((p) => {
            if (!p.description) {
                this._logger.info(`Plugin ${p.name} in package ${packageName} has no description property, using description from package.`);
                (p as any).description = pluginPackage?.description;
            }
        });

        // Evaluate templates in the config object
        fixedPluginDefinitions.forEach((p) => {
            if (p.defaultConfig) {
                configUtils.evaluateTemplatesInConfigObject(p.defaultConfig, this._logger);
            }
        });

        return fixedPluginDefinitions;
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
            if (plugin.status === 'loaded') {
                this._logger.debug(`Unloading plugin: ${plugin.name}, type: ${plugin.type}`);
                await loader.unload(plugin);
            }
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
}
