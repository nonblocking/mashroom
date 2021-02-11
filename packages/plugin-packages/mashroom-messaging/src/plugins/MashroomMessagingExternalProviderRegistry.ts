
import type {
    MashroomMessagingExternalProvider,
} from '../../type-definitions';
import type {
    MashroomExternalMessagingProviderRegistry as MashroomExternalMessagingProviderRegistryType,
} from '../../type-definitions/internal';

type MashroomExternalMessagingProviderHolder = {
    readonly pluginName: string,
    readonly provider: MashroomMessagingExternalProvider
}

export default class MashroomMessagingExternalProviderRegistry implements MashroomExternalMessagingProviderRegistryType {

    _providers: Array<MashroomExternalMessagingProviderHolder>;

    constructor() {
        this._providers = [];
    }

    findProvider(pluginName: string): MashroomMessagingExternalProvider | undefined | null {
        const holder = this._providers.find((p) => p.pluginName === pluginName);
        if (holder) {
            return holder.provider;
        }
        return null;
    }

    register(pluginName: string, provider: MashroomMessagingExternalProvider): void {
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

    get providers(): Readonly<Array<MashroomMessagingExternalProvider>> {
        return Object.freeze(this._providers.map((p) => p.provider));
    }

}
