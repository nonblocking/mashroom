
import type {MashroomSecurityProvider} from '../../type-definitions';
import type {
    MashroomSecurityProviderRegistry as MashroomSecurityProviderRegistryType,
} from '../../type-definitions/internal';

type MashroomSecurityProviderHolder = {
    readonly pluginName: string;
    readonly provider: MashroomSecurityProvider;
}

export default class MashroomSecurityProviderRegistry implements MashroomSecurityProviderRegistryType {

    private _providers: Array<MashroomSecurityProviderHolder>;

    constructor() {
        this._providers = [];
    }

    findProvider(pluginName: string): MashroomSecurityProvider | undefined | null {
        const holder = this._providers.find((p) => p.pluginName === pluginName);
        if (holder) {
            return holder.provider;
        }
        return null;
    }

    register(pluginName: string, provider: MashroomSecurityProvider): void {
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

    get providers(): Readonly<Array<MashroomSecurityProvider>> {
        return Object.freeze(this._providers.map((p) => p.provider));
    }

}
