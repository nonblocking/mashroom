
import type {RequestHandler} from 'express';
import type {MashroomSessionStoreProvider} from './api';

export interface MashroomSessionMiddleware {
    middleware(): RequestHandler;
}

export interface MashroomSessionStoreProviderRegistry {
    readonly providers: Array<MashroomSessionStoreProvider>;
    findProvider(pluginName: string): MashroomSessionStoreProvider | undefined;
    register(pluginName: string, provider: MashroomSessionStoreProvider): void;
    unregister(pluginName: string): void;
}
