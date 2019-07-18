// @flow

import type {
    MashroomSecurityProvider,
    MashroomSecurityProviderRegistry as MashroomSecurityProviderRegistryType,
} from '../../type-definitions';

type MashroomSecurityProviderHolder = {
    +pluginName: string,
    +provider: MashroomSecurityProvider
}

export default class MashroomSecurityProviderRegistry implements MashroomSecurityProviderRegistryType {

    _providers: Array<MashroomSecurityProviderHolder>;

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

    register(pluginName: string, provider: MashroomSecurityProvider) {
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

    get providers(): Array<MashroomSecurityProvider> {
        return Object.freeze(this._providers.map((p) => p.provider));
    }

}
