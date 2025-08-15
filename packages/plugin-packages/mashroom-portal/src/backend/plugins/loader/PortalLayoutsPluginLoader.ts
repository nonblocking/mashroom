
import {resolve} from 'path';
import {fileURLToPath} from 'url';
import {PluginConfigurationError} from '@mashroom/mashroom-utils';

import type {MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalLayout} from '../../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../../type-definitions/internal';

const removeTrailingSlash = (str: string) => {
    return str.endsWith('/') ? str.slice(0, -1) : str;
};

export default class PortalLayoutsPluginLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;
    private _loadedLayouts: Map<string, any>;

    constructor(private _registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.portal.plugin.loader');
        this._loadedLayouts = new Map();
    }

    get name(): string {
        return 'Portal Layout Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin): MashroomPluginConfig {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        const layouts = plugin.pluginDefinition.layouts;
        if (!layouts) {
            throw new PluginConfigurationError(`Layouts plugin ${plugin.name}: Missing property 'layouts'!`);
        }

        for (const layoutId in layouts) {
            if (layoutId in layouts) {
                let layoutPath = layouts[layoutId];
                if (!layoutPath.startsWith('/')) {
                    if (layoutPath.startsWith('./')) {
                        layoutPath = layoutPath.slice(2);
                    }
                    if (plugin.pluginPackage.pluginPackageURL.protocol === 'file:') {
                        layoutPath = resolve(fileURLToPath(plugin.pluginPackage.pluginPackageURL), layoutPath);
                    } else {
                        layoutPath = `${removeTrailingSlash(plugin.pluginPackage.pluginPackageURL.toString())}/${layoutPath}`;
                    }
                }

                const name = `${plugin.name} ${layoutId}`;

                const layout: MashroomPortalLayout = {
                    name,
                    description: plugin.description,
                    lastReloadTs: plugin.lastReloadTs || Date.now(),
                    layoutId,
                    layoutPath,
                };

                this._logger.info('Registering layout:', {layout});
                this._registry.registerLayout(layout);

                let pluginLayouts = this._loadedLayouts.get(plugin.name);
                if (!pluginLayouts) {
                    pluginLayouts = {};
                    this._loadedLayouts.set(plugin.name, pluginLayouts);
                }
                pluginLayouts[name] = true;
            }
        }

    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        if (this._loadedLayouts.has(plugin.name)) {
            const pluginLayouts = this._loadedLayouts.get(plugin.name);
            for (const pluginName in pluginLayouts) {
                if (pluginName in pluginLayouts) {
                    this._logger.info(`Unregistering layout:${pluginName}`);
                    this._registry.unregisterLayout(pluginName);
                }
            }
        }
    }
}
