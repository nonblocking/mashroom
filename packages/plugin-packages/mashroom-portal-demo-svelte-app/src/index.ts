import { mount, hydrate, unmount } from 'svelte';
import App from './App.svelte';
import type { MashroomPortalAppPluginBootstrapFunction } from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    portalAppHostElement.innerHTML = '';

    let app;
    if (portalAppSetup.serverSideRendered) {
        console.info('Hydrating Svelte Demo App');
        app = hydrate(App,{
            target: portalAppHostElement,
            props: {
                messageBus: clientServices.messageBus,
                appConfig: portalAppSetup.appConfig,
            },
        });
    } else {
        console.info('Starting Svelte Demo App');
        app = mount(App,{
            target: portalAppHostElement,
            props: {
                messageBus: clientServices.messageBus,
                appConfig: portalAppSetup.appConfig,
            },
        });
    }

    return {
        willBeRemoved: () => {
            unmount(app);
        }
    };
};

(global as any).startSvelteDemoApp = bootstrap;
