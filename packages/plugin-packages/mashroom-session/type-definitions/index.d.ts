/* eslint-disable */

import {MashroomPluginConfig, MashroomPluginContextHolder} from "@mashroom/mashroom/type-definitions";

// -------- Converted from api.js via https://flow-to-ts.netlify.com ----------

export type MashroomSessionStoreProvider = any;

/**
 * Bootstrap method definition for security-provider plugins
 */
export type MashroomSessionStoreProviderPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
    expressSession: any,
) => Promise<MashroomSessionStoreProvider>;
