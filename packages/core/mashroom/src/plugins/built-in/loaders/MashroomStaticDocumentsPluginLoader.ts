
import {resolve} from 'path';
import {fileURLToPath} from 'url';
import express from 'express';
import {PluginConfigurationError} from '@mashroom/mashroom-utils';
import ExpressRequestHandlerBasePluginLoader from './ExpressRequestHandlerBasePluginLoader';

import type {RequestHandler, Application} from 'express';
import type {MashroomPluginContextHolder, MashroomPluginConfig, MashroomPlugin} from '../../../../type-definitions';

export default class MashroomStaticDocumentsPluginLoader extends ExpressRequestHandlerBasePluginLoader {

    addPluginInstance(expressApplication: Application, pluginInstance: RequestHandler, pluginConfig: MashroomPluginConfig) {
        expressApplication.use(pluginConfig.path, pluginInstance);
    }

    async createPluginInstance(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const documentRoot: string | undefined | null = plugin.pluginDefinition.documentRoot;
        if (!documentRoot) {
            throw new PluginConfigurationError(`Static plugin ${plugin.name}: Missing property 'documentRoot'!`);
        }
        if (plugin.pluginPackage.pluginPackageURL.protocol !== 'file:') {
            throw new PluginConfigurationError(`Static plugin ${plugin.name}: Protocol ${plugin.pluginPackage.pluginPackageURL.protocol} not supported'!`);
        }

        const pluginPackagePath = fileURLToPath(plugin.pluginPackage.pluginPackageURL);
        const fullDocumentRoot = resolve(pluginPackagePath, documentRoot);
        return express.static(fullDocumentRoot);
    }

    isMiddleware() {
        return false;
    }

    get name(): string {
        return 'Static Documents Plugin Loader';
    }

}
