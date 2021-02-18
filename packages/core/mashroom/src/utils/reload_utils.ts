
import {sep} from 'path';
import type {RequestHandler, Application} from 'express';
import type {MashroomPlugin} from '../../type-definitions';

export const removeFromExpressStack = (expressApplication: Application, plugin: MashroomPlugin) => {
    const expressLayers = expressApplication._router.stack;
    const expressLayerIndex = expressLayers.findIndex((requestHandler: RequestHandler) => requestHandler.name === plugin.name);
    if (expressLayerIndex) {
        expressLayers.splice(expressLayerIndex, 1);
    }
};

export const removePackageModulesFromNodeCache = (packagePath: string) => {
    for (const modulePath in require.cache) {
        if (modulePath.startsWith(packagePath + sep)) {
            delete require.cache[modulePath];
        }
    }
};

