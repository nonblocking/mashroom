
import MashroomHttpProxyInterceptorRegistry from '../../src/plugins/MashroomHttpProxyInterceptorRegistry';
import {MashroomHttpProxyInterceptor} from '../../type-definitions';

const interceptor1: MashroomHttpProxyInterceptor = {
    async interceptRequest() {
        return null;
    },
    async interceptResponse() {
        return null;
    }
}

const interceptor2: MashroomHttpProxyInterceptor = {
    async interceptRequest() {
        return null;
    },
    async interceptResponse() {
        return null;
    }
}

const interceptor3: MashroomHttpProxyInterceptor = {
    async interceptRequest() {
        return null;
    },
    async interceptResponse() {
        return null;
    }
}

describe('MashroomHttpProxyInterceptorRegistry', () => {

    it('sorts interceptors correctly',  async () => {
        const registry = new MashroomHttpProxyInterceptorRegistry();
        registry.register(1000, 'A', interceptor1);
        registry.register(4000, 'B', interceptor2);
        registry.register(-10, 'C', interceptor3);

        expect(registry.interceptors.map((i) => i.pluginName)).toEqual([
            'C', 'A', 'B'
        ]);
    });
});
