
import type {Store} from 'express-session';
import type {MashroomPluginConfig, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';

export type MashroomSessionStoreProvider = Store;

/**
 * Bootstrap method definition for session-store-provider plugins
 */
export type MashroomSessionStoreProviderPluginBootstrapFunction = (pluginName: string, pluginConfig: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder, expressSession: any) => Promise<MashroomSessionStoreProvider>;
