// @flow

import type {MashroomPluginContextHolder, ExpressMiddleware, MashroomPluginConfig} from '@mashroom/mashroom/type-definitions';


export interface MashroomSessionMiddleware {
    middleware(): ExpressMiddleware
}

export type MashroomSessionStoreProvider = any;

export interface MashroomSessionStoreProviderRegistry {
    +providers: Array<MashroomSessionStoreProvider>;
    findProvider(pluginName: string): ?MashroomSessionStoreProvider;
    register(pluginName: string, provider: MashroomSessionStoreProvider): void;
    unregister(pluginName: string): void;
}

/**
 * Bootstrap method definition for security-provider plugins
 */
export type MashroomSessionStoreProviderPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder, expressSession: any) => Promise<MashroomSessionStoreProvider>;

