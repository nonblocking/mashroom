
import type {
    MashroomSessionStoreProvider,
} from '../../type-definitions';
import type {
    MashroomSessionStoreProviderRegistry as MashroomSessionStoreProviderRegistryType,
} from '../../type-definitions/internal';

type MashroomSessionStoreProviderHolder = {
    readonly pluginName: string;
    readonly provider: MashroomSessionStoreProvider;
}

export default class MashroomSessionStoreProviderRegistry implements MashroomSessionStoreProviderRegistryType {

    _providers: Array<MashroomSessionStoreProviderHolder>;

    constructor() {
        this._providers = [];
    }

    findProvider(pluginName: string): MashroomSessionStoreProvider | undefined {
        const holder = this._providers.find((p) => p.pluginName === pluginName);
        if (holder) {
            return holder.provider;
        }
        return undefined;
    }

    register(pluginName: string, provider: MashroomSessionStoreProvider): void {
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

    get providers(): Array<MashroomSessionStoreProvider> {
        // @ts-ignore
        return Object.freeze(this._providers.map((p) => p.provider));
    }
}
