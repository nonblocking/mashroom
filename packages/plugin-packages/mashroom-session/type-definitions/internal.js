// @flow

import type {ExpressMiddleware} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSessionStoreProvider,
} from './api';

export interface MashroomSessionMiddleware {
    middleware(): ExpressMiddleware
}


export interface MashroomSessionStoreProviderRegistry {
    +providers: Array<MashroomSessionStoreProvider>;
    findProvider(pluginName: string): ?MashroomSessionStoreProvider;
    register(pluginName: string, provider: MashroomSessionStoreProvider): void;
    unregister(pluginName: string): void;
}
