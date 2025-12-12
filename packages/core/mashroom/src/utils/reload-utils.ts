
import {sep} from 'path';
import {MessageChannel} from 'worker_threads';
import type {Application} from 'express';
import type {MashroomLogger, MashroomPlugin} from '../../type-definitions';

export const removeFromExpressStack = (expressApplication: Application, plugin: MashroomPlugin) => {
    const expressLayers = expressApplication.router.stack;
    const expressLayerIndex = expressLayers.findIndex((layer) => {
        if (layer.handle.name === plugin.name) {
            return true;
        }
        return layer.route?.stack?.some((routeLayer) => routeLayer.handle.name === plugin.name);
    });
    if (expressLayerIndex !== -1) {
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

export const installHotESModuleReloadingHook = async (logger: MashroomLogger) => {
    const {port1, port2} = new MessageChannel();
    port1.on('message', (message) => {
        logger.debug(message);
    });

    (globalThis as any)['HOOK_LOG_MESSAGE_PORT'] = port2;

    try {
        // @ts-ignore
        await import('../hooks/moduleHotReloadableHooksRegister.mjs');
    } catch (e) {
        logger.error('Failed to install module hot reload hooks', e);
    }
};
