import type {MashroomPluginContext} from '@mashroom/mashroom/type-definitions';
import type {MashroomStorageCollection, MashroomStorageService} from '@mashroom/mashroom-storage/type-definitions';
import type {RemotePortalAppEndpoint} from '../../../type-definitions';

const REMOTE_PORTAL_APP_ENDPOINTS_COLLECTION = 'mashroom-remote-portal-app-endpoints';

export default async (pluginContext: MashroomPluginContext): Promise<MashroomStorageCollection<RemotePortalAppEndpoint>> => {
    const storageService = pluginContext.services.storage!.service as MashroomStorageService;
    return storageService.getCollection(REMOTE_PORTAL_APP_ENDPOINTS_COLLECTION);
};
