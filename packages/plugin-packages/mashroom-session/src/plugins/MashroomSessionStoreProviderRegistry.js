// @flow

import type {
    MashroomSessionStoreProvider,
    MashroomSessionStoreProviderRegistry as MashroomSessionStoreProviderRegistryType,
} from '../../type-definitions';

type MashroomSessionStoreProviderHolder = {
    +pluginName: string,
    +provider: MashroomSessionStoreProvider
}

export default class MashroomSessionStoreProviderRegistry implements MashroomSessionStoreProviderRegistryType {

    _providers: Array<MashroomSessionStoreProviderHolder>;

    constructor() {
        this._providers = [];
    }

    findProvider(pluginName: string) {
        const holder = this._providers.find((p) => p.pluginName === pluginName);
        if (holder) {
            return holder.provider;
        }
        return null;
    }

    register(pluginName: string, provider: MashroomSessionStoreProvider) {
        // Remove existing
        this.unregister(pluginName);

        this._providers.push({
            pluginName,
            provider,
        });
    }

    unregister(pluginName: string) {
        this._providers = this._providers.filter((p) => p.pluginName !== pluginName);
    }

    get providers(): Array<MashroomSessionStoreProvider> {
        return Object.freeze(this._providers.map((p) => p.provider));
    }
}
