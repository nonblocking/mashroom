
import type {MashroomHttpProxyInterceptor} from '../../type-definitions';
import type {
    MashroomHttpProxyInterceptorHolder,
    MashroomHttpProxyInterceptorRegistry as MashroomHttpProxyInterceptorRegistryType,
} from '../../type-definitions/internal';

export default class MashroomHttpProxyInterceptorRegistry implements MashroomHttpProxyInterceptorRegistryType {

    private _interceptors: Array<MashroomHttpProxyInterceptorHolder>;

    constructor() {
        this._interceptors = [];
    }

    register(pluginName: string, interceptor: MashroomHttpProxyInterceptor): void {
        // Remove existing
        this.unregister(pluginName);

        this._interceptors.push({
            pluginName,
            interceptor,
        });
    }

    unregister(pluginName: string): void {
        this._interceptors = this.interceptors.filter((holder) => holder.pluginName !== pluginName);
    }

    get interceptors(): Array<MashroomHttpProxyInterceptorHolder> {
        // @ts-ignore
        return Object.freeze(this._interceptors);
    }

}
