import { mount, unmount } from 'svelte';
import App from './App.svelte';
import type { MashroomPortalAppPluginBootstrapFunction } from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    portalAppHostElement.innerHTML = '';
    const app = mount(App,{
        target: portalAppHostElement,
        props: {
            messageBus: clientServices.messageBus,
            appConfig: portalAppSetup.appConfig,
        },
    });

    return {
        willBeRemoved: () => {
            unmount(app);
        }
    };
};

(global as any).startSvelteDemoApp = bootstrap;
