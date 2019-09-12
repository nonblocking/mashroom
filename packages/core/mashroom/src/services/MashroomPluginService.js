// @flow

import type {MashroomPluginService as MashroomPluginServiceType, MashroomPluginRegistry} from '../../type-definitions';

type Listeners = {
    [pluginName: string]: Array<() => void>
}

export default class MashroomPluginService implements MashroomPluginServiceType {

    _getPluginRegistry: MashroomPluginRegistry;
    _loadedListeners: Listeners;
    _unloadlisteners: Listeners;

    constructor(pluginRegistry: MashroomPluginRegistry) {
        this._getPluginRegistry = pluginRegistry;
        this._loadedListeners = {};
        this._unloadlisteners = {};

        this._getPluginRegistry.on('loaded', (event) => {
            const listeners = this._loadedListeners[event.pluginName];
            if (listeners) {
                listeners.forEach((l) => l());
                delete this._loadedListeners[event.pluginName];
            }
        });
        this._getPluginRegistry.on('unload', (event) => {
            const listeners = this._unloadlisteners[event.pluginName];
            if (listeners) {
                listeners.forEach((l) => l());
                delete this._unloadlisteners[event.pluginName];
            }
        });
    }

    getPluginLoaders() {
        return this._getPluginRegistry.pluginLoaders;
    }

    getPlugins() {
        return this._getPluginRegistry.plugins;
    }

    getPluginPackages() {
        return this._getPluginRegistry.pluginPackages;
    }

    onLoadedOnce(pluginName: string, listener: () => void) {
        this._loadedListeners[pluginName] = this._loadedListeners[pluginName] || [];
        this._loadedListeners[pluginName].push(listener);
    }

    onUnloadOnce(pluginName: string, listener: () => void) {
        this._unloadlisteners[pluginName] = this._unloadlisteners[pluginName] || [];
        this._unloadlisteners[pluginName].push(listener);
    }
}
