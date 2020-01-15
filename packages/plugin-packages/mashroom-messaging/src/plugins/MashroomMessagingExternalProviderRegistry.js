// @flow

import type {
    MashroomMessagingExternalProvider,
} from '../../type-definitions';
import type {
    MashroomExternalMessagingProviderRegistry as MashroomExternalMessagingProviderRegistryType,
} from '../../type-definitions/internal';

type MashroomExternalMessagingProviderHolder = {
    +pluginName: string,
    +provider: MashroomMessagingExternalProvider
}

export default class MashroomMessagingExternalProviderRegistry implements MashroomExternalMessagingProviderRegistryType {

    _providers: Array<MashroomExternalMessagingProviderHolder>;

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

    register(pluginName: string, provider: MashroomMessagingExternalProvider) {
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

    get providers(): Array<MashroomMessagingExternalProvider> {
        return Object.freeze(this._providers.map((p) => p.provider));
    }

}
