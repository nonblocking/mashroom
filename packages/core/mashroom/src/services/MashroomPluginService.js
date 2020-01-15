// @flow

import type {
    MashroomPluginService as MashroomPluginServiceType,
    MashroomLogger,
    MashroomLoggerFactory
} from '../../type-definitions';
import type {
    MashroomPluginRegistry,
} from '../../type-definitions/internal';

type Listeners = {
    [pluginName: string]: Array<() => void>
}

const privatePropsMap: WeakMap<MashroomPluginService, {
    pluginRegistry: MashroomPluginRegistry;
}> = new WeakMap();

export default class MashroomPluginService implements MashroomPluginServiceType {

    _loadedListeners: Listeners;
    _unloadListeners: Listeners;
    _log: MashroomLogger;

    constructor(pluginRegistry: MashroomPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        privatePropsMap.set(this, {
            pluginRegistry
        });
        this._log = loggerFactory('mashroom.plugins.service');
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
                        this._log.error('Loaded event listener threw error', error);
                    }
                });
            }
        });
        pluginRegistry.on('unload', (event) => {
            const listeners = this._unloadListeners[event.pluginName];
            delete this._unloadListeners[event.pluginName];
            if (listeners) {
                listeners.forEach((l) => {
                    try {
                        l();
                    } catch (error) {
                        this._log.error('Unload event listener threw error', error);
                    }
                });
            }
        });
    }

    getPluginLoaders() {
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return privateProps.pluginRegistry.pluginLoaders;
        }
        return {};
    }

    getPlugins() {
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return privateProps.pluginRegistry.plugins;
        }
        return [];
    }

    getPluginPackages() {
        const privateProps = privatePropsMap.get(this);
        if (privateProps) {
            return privateProps.pluginRegistry.pluginPackages;
        }
        return [];
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
