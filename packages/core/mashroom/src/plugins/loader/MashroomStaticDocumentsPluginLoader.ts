
import express from 'express';
import path from 'path';
import PluginConfigurationError from '@mashroom/mashroom-utils/lib/PluginConfigurationError';
import ExpressRequestHandlerBasePluginLoader from './ExpressRequestHandlerBasePluginLoader';

import type {RequestHandler} from 'express';
import type {MashroomPluginContextHolder, ExpressApplication, MashroomPluginConfig, MashroomPlugin} from '../../../type-definitions';

export default class MashroomStaticDocumentsPluginLoader extends ExpressRequestHandlerBasePluginLoader {

    addPluginInstance(expressApplication: ExpressApplication, pluginInstance: RequestHandler, pluginConfig: MashroomPluginConfig) {
        expressApplication.use(pluginConfig.path, pluginInstance);
    }

    async createPluginInstance(plugin: MashroomPlugin, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder) {
        const documentRoot: string | undefined | null = plugin.pluginDefinition.documentRoot;
        if (!documentRoot) {
            throw new PluginConfigurationError(`Static plugin ${plugin.name} is missing property 'documentRoot'!`);
        }

        const fullDocumentRoot = path.resolve(plugin.pluginPackage.pluginPackagePath, documentRoot);
        return express.static(fullDocumentRoot);
    }

    isMiddleware() {
        return false;
    }

    get name(): string {
        return 'Static Documents Plugin Loader';
    }

}
