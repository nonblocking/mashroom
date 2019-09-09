// @flow

import type {MashroomPluginService as MashroomPluginServiceType, MashroomPluginRegistry} from '../../type-definitions';

export default class MashroomPluginService implements MashroomPluginServiceType {

    _getPluginRegistry: () => MashroomPluginRegistry;

    constructor(pluginRegistry: MashroomPluginRegistry) {
        this._getPluginRegistry = () => {
            return pluginRegistry;
        };
    }

    getPluginLoaders() {
        return this._getPluginRegistry().pluginLoaders;
    }

    getPlugins() {
        return this._getPluginRegistry().plugins;
    }

    getPluginPackages() {
        return this._getPluginRegistry().pluginPackages;
    }
}
