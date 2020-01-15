// @flow

import type {MashroomPluginConfig, MashroomPluginContextHolder} from "@mashroom/mashroom/type-definitions";

export type MashroomSessionStoreProvider = any;

/**
 * Bootstrap method definition for security-provider plugins
 */
export type MashroomSessionStoreProviderPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder, expressSession: any) => Promise<MashroomSessionStoreProvider>;


