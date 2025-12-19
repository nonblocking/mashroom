import getClientServices from './client-services';

import type {MashroomPortalAppLifecycleHooks, MashroomPortalAppSetup} from '@mashroom/mashroom-portal/type-definitions';
import type {LoadedPortalApp, MessageBusPortalAppUnderTest} from './types';

export default async (appName: string, hostElementId: string, hiddenHostElementId: string, setup: MashroomPortalAppSetup, messageBusPortalAppUnderTest: MessageBusPortalAppUnderTest): Promise<LoadedPortalApp> => {
    try {
        const clientServices = getClientServices();
        const {portalAppService} = clientServices;

        const {instanceId, clientBootstrap} = await portalAppService.loadAppClientBootstrap(hiddenHostElementId, appName);

        const wrapperElem = document.getElementById(hostElementId);
        const hostElem = document.createElement('div');
        if (wrapperElem) {
            wrapperElem.innerHTML = '';
            wrapperElem.appendChild(hostElem);
        }

        const modifiedClientServices = {
            ...clientServices,
            messageBus: messageBusPortalAppUnderTest
        };

        const result = clientBootstrap(hostElem, setup, modifiedClientServices);
        let lifecycleHooks: MashroomPortalAppLifecycleHooks | null = null;
        if (result) {
            lifecycleHooks = ('then' in result ? await result : result) ?? null;
        }

        return {
            instanceId,
            lifecycleHooks,
        };
    } catch (error) {
        console.error('Error loading Portal App into sandbox:', error);
        const wrapperElem = document.getElementById(hostElementId);
        if (wrapperElem) {
            wrapperElem.innerHTML = `<div class="mashroom-portal-app-loading-error">Loading ${appName} failed: ${error}</div>`;
        }
        throw error;
    }
};
