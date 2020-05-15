
import type {
    MashroomMemoryCacheProvider,
} from './api';

export interface MashroomMemoryCacheProviderRegistry {
    readonly providers: Array<MashroomMemoryCacheProvider>;
    findProvider(pluginName: string): MashroomMemoryCacheProvider | undefined;
    register(pluginName: string, provider: MashroomMemoryCacheProvider): void;
    unregister(pluginName: string): void;
}
