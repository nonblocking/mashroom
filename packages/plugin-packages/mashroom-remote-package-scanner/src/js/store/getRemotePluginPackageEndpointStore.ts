import type {MashroomPluginContext} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorageService} from '@mashroom/mashroom-storage/type-definitions';
import type {RemotePluginPackageEndpoint} from '../types';

const REMOTE_PLUGIN_PACKAGE_ENDPOINTS_COLLECTION = 'mashroom-plugin-package-endpoints';

export default async (pluginContext: MashroomPluginContext): Promise<MashroomStorageCollection<RemotePluginPackageEndpoint>> => {
    const storageService = pluginContext.services.storage!.service as MashroomStorageService;
    return storageService.getCollection(REMOTE_PLUGIN_PACKAGE_ENDPOINTS_COLLECTION);
};
