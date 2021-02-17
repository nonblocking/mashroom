
import type {ExpressMiddleware} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSessionStoreProvider,
} from './api';

export interface MashroomSessionMiddleware {
    middleware(): ExpressMiddleware;
}

export interface MashroomSessionStoreProviderRegistry {
    readonly providers: Array<MashroomSessionStoreProvider>;
    findProvider(pluginName: string): MashroomSessionStoreProvider | undefined;
    register(pluginName: string, provider: MashroomSessionStoreProvider): void;
    unregister(pluginName: string): void;
}
