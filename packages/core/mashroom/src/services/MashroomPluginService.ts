
import type {
    MashroomPluginService as MashroomPluginServiceType,
    MashroomLogger,
    MashroomLoggerFactory,
} from '../../type-definitions';
import type {
    MashroomPluginRegistry,
} from '../../type-definitions/internal';

type Listeners = {
    [pluginName: string]: Array<() => void>
}

export default class MashroomPluginService implements MashroomPluginServiceType {

    private readonly _loadedListeners: Listeners;
    private readonly _unloadListeners: Listeners;
    private readonly _logger: MashroomLogger;

    constructor(private pluginRegistry: MashroomPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.service');
        this._loadedListeners = {};
        this._unloadListeners = {};

        pluginRegistry.on('loaded', (event) => {
            const listeners = this._loadedListeners[event.pluginName];
            delete this._loadedListeners[event.pluginName];
            if (listeners) {
                listeners.forEach((l) => {
                    try {
                        l();
                    } catch (error) {
                        this._logger.error('Loaded event listener threw error', error);
                    }
                });
            }
        });
        pluginRegistry.on('unloaded', (event) => {
            const listeners = this._unloadListeners[event.pluginName];
            delete this._unloadListeners[event.pluginName];
            if (listeners) {
                listeners.forEach((l) => {
                    try {
                        l();
                    } catch (error) {
                        this._logger.error('Unload event listener threw error', error);
                    }
                });
            }
        });
    }

    getPlugins() {
        return this.pluginRegistry.plugins;
    }

    getPluginPackages() {
        return this.pluginRegistry.pluginPackages;
    }

    getPotentialPluginPackages() {
        return this.pluginRegistry.potentialPluginPackages;
    }

    getPotentialPluginPackagesByScanner(scannerName: string) {
        return this.pluginRegistry.potentialPluginPackages.filter((pp) => pp.scannerName === scannerName);
    }

    getPluginLoaders() {
        return this.pluginRegistry.pluginLoaders;
    }

    onLoadedOnce(pluginName: string, listener: () => void) {
        this._loadedListeners[pluginName] = this._loadedListeners[pluginName] || [];
        this._loadedListeners[pluginName].push(listener);
    }

    onUnloadOnce(pluginName: string, listener: () => void) {
        this._unloadListeners[pluginName] = this._unloadListeners[pluginName] || [];
        this._unloadListeners[pluginName].push(listener);
    }
}
