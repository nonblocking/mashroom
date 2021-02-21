
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

    register(order: number, pluginName: string, interceptor: MashroomHttpProxyInterceptor): void {
        // Remove existing
        this.unregister(pluginName);

        this._interceptors.push({
            order,
            pluginName,
            interceptor,
        });

        // Sort
        this._interceptors.sort((i1, i2) => i1.order - i2.order);
    }

    unregister(pluginName: string): void {
        this._interceptors = this.interceptors.filter((holder) => holder.pluginName !== pluginName);
    }

    get interceptors(): Readonly<Array<MashroomHttpProxyInterceptorHolder>> {
        return Object.freeze(this._interceptors);
    }

}
