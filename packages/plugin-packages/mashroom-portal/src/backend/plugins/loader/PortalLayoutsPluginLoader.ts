
import path from 'path';
// @ts-ignore
import {PluginConfigurationError} from '@mashroom/mashroom-utils/lib/PluginConfigurationError';

import type {MashroomPluginLoader, MashroomPlugin, MashroomPluginConfig, MashroomPluginContextHolder, MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalLayout} from '../../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../../type-definitions/internal';

export default class PortalLayoutsPluginLoader implements MashroomPluginLoader {

    private logger: MashroomLogger;
    private loadedLayouts: Map<string, any>;

    constructor(private registry: MashroomPortalPluginRegistry, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.portal.plugin.loader');
        this.loadedLayouts = new Map();
    }

    get name(): string {
        return 'Portal Layout Plugin Loader';
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {};
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const layouts = plugin.pluginDefinition.layouts;
        if (!layouts) {
            throw new PluginConfigurationError(`Invalid configuration of layouts plugin ${plugin.name}: No layouts property defined`);
        }

        for (const layoutId in layouts) {
            if (layouts.hasOwnProperty(layoutId)) {
                let layoutPath = layouts[layoutId];
                if (!layoutPath.startsWith('/')) {
                    layoutPath = path.resolve(plugin.pluginPackage.pluginPackagePath, layoutPath);
                }

                const name = `${plugin.name} ${layoutId}`;

                const layout: MashroomPortalLayout = {
                    name,
                    description: plugin.description,
                    lastReloadTs: Date.now(),
                    layoutId,
                    layoutPath,
                };

                this.logger.info('Registering layout:', {layout});
                this.registry.registerLayout(layout);

                let pluginLayouts = this.loadedLayouts.get(plugin.name);
                if (!pluginLayouts) {
                    pluginLayouts = {};
                    this.loadedLayouts.set(plugin.name, pluginLayouts);
                }
                pluginLayouts[name] = true;
            }
        }

    }

    async unload(plugin: MashroomPlugin) {
        if (this.loadedLayouts.has(plugin.name)) {
            const pluginLayouts = this.loadedLayouts.get(plugin.name);
            for (const pluginName in pluginLayouts) {
                if (pluginLayouts.hasOwnProperty(pluginName)) {
                    this.logger.info(`Unregistering layout:${pluginName}`);
                    this.registry.unregisterLayout(pluginName);
                }
            }
        }
    }
}
