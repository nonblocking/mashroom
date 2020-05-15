
import {LOCAL_MEMORY_CACHE_PROVIDER_NAME} from '../constants';
import MashroomMemoryCacheProviderRegistry from '../plugins/MashroomMemoryCacheProviderRegistry';
import MashroomMemoryCacheProviderLocal from '../plugins/providers/MashroomMemoryCacheProviderLocal';

const pluginRegistry = new MashroomMemoryCacheProviderRegistry();
pluginRegistry.register(LOCAL_MEMORY_CACHE_PROVIDER_NAME, new MashroomMemoryCacheProviderLocal());

export default {
    pluginRegistry,
};
