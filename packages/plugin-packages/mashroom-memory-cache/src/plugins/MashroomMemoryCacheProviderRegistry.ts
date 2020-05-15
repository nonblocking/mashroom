
import type {
    MashroomMemoryCacheProvider,
} from '../../type-definitions';
import type {
    MashroomMemoryCacheProviderRegistry as MashroomMemoryCacheProviderRegistryType,
} from '../../type-definitions/internal';

type MashroomMemoryCacheProviderHolder = {
    readonly pluginName: string;
    readonly provider: MashroomMemoryCacheProvider;
}

export default class MashroomMemoryCacheProviderRegistry implements MashroomMemoryCacheProviderRegistryType {

    private _providers: Array<MashroomMemoryCacheProviderHolder>;

    constructor() {
        this._providers = [];
    }

    findProvider(pluginName: string): MashroomMemoryCacheProvider | undefined {
        const holder = this._providers.find((p) => p.pluginName === pluginName);
        if (holder) {
            return holder.provider;
        }
        return undefined;
    }

    register(pluginName: string, provider: MashroomMemoryCacheProvider): void {
        // Remove existing
        this.unregister(pluginName);

        this._providers.push({
            pluginName,
            provider,
        });
    }

    unregister(pluginName: string): void {
        this._providers = this._providers.filter((p) => p.pluginName !== pluginName);
    }

    get providers(): Array<MashroomMemoryCacheProvider> {
        return this._providers.map((p) => p.provider);
    }
}
