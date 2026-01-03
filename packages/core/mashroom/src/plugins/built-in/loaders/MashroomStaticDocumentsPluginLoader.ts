
import {resolve} from 'path';
import {fileURLToPath} from 'url';
import express from 'express';
import {PluginConfigurationError} from '@mashroom/mashroom-utils';
import {removeFromExpressStack} from '../../../utils/reload-utils';
import ExpressRequestHandlerWrapper from './ExpressRequestHandlerWrapper';

import type {Application} from 'express';
import type {
    MashroomPluginContextHolder,
    MashroomPluginConfig,
    MashroomPlugin,
    MashroomPluginLoader,
    MashroomLogger,
    MashroomLoggerFactory
} from '../../../../type-definitions';

export default class MashroomStaticDocumentsPluginLoader implements MashroomPluginLoader {

    private readonly _logger: MashroomLogger;
    private readonly _loadedPlugins: Map<string, string>;

    constructor(private _expressApplication: Application, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.plugins.loader');
        this._loadedPlugins = new Map();
    }

    generateMinimumConfig(plugin: MashroomPlugin) {
        return {
            path: `/${plugin.name}`,
        };
    }

    async load(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        if (!pluginConfig.path.startsWith('/')) {
            pluginConfig.path = `/${pluginConfig.path}`;
        }

        const documentRoot: string | undefined | null = plugin.pluginDefinition.documentRoot;
        if (!documentRoot) {
            throw new PluginConfigurationError(`Static plugin ${plugin.name}: Missing property 'documentRoot'!`);
        }
        if (plugin.pluginPackage.pluginPackageUrl.protocol !== 'file:') {
            throw new PluginConfigurationError(`Static plugin ${plugin.name}: Protocol ${plugin.pluginPackage.pluginPackageUrl.protocol} not supported'!`);
        }

        const pluginPackagePath = fileURLToPath(plugin.pluginPackage.pluginPackageUrl);
        const fullDocumentRoot = resolve(pluginPackagePath, documentRoot);
        const staticPlugin = express.static(fullDocumentRoot);
        const wrapper = new ExpressRequestHandlerWrapper(plugin.name, staticPlugin);

        this._logger.info(`Adding ${plugin.type} Express plugin ${plugin.name} to path: ${pluginConfig.path}`);
        this._expressApplication.use(pluginConfig.path, wrapper.handler());

        this._loadedPlugins.set(plugin.name, pluginConfig.path);
    }

    async unload(plugin: MashroomPlugin) {
        const loadedPluginPath = this._loadedPlugins.get(plugin.name);
        if (loadedPluginPath) {
            this._logger.info(`Removing ${plugin.type} express plugin ${plugin.name} from path: ${loadedPluginPath}`);
            removeFromExpressStack(this._expressApplication, plugin);
            this._loadedPlugins.delete(plugin.name);
        }
    }

    get name(): string {
        return 'Static Documents Plugin Loader';
    }

}
