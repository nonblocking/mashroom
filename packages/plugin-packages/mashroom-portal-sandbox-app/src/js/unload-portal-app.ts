import getClientServices from './client-services';

import type {LoadedPortalApp} from './types';

export default async (loadedApp: LoadedPortalApp): Promise<void> => {
    try {
        const clientServices = getClientServices();
        const {portalAppService} = clientServices;

        if (loadedApp.lifecycleHooks) {
            await loadedApp.lifecycleHooks.willBeRemoved?.();
        }

        await portalAppService.unloadApp(loadedApp.instanceId);

    } catch (error) {
        console.error('Error unloading Portal App from sandbox:', error);
    }
};
