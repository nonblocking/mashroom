// @flow

import {sep} from 'path';
import type {ExpressApplication, MashroomPlugin} from '../../type-definitions';

export const removeFromExpressStack = (expressApplication: ExpressApplication, plugin: MashroomPlugin) => {
    // $FlowFixMe
    const expressLayers = expressApplication._router.stack;
    const expressLayerIndex = expressLayers.findIndex((requestHandler) => requestHandler.name === plugin.name);
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

