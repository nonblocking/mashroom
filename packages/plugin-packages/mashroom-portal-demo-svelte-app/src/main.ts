import App from './App.svelte';
import type { SvelteComponent } from 'svelte';
import type { MashroomPortalAppPluginBootstrapFunction } from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    portalAppHostElement.innerHTML = '';
    const app: SvelteComponent = new App({
        target: portalAppHostElement,
        props: {
            messageBus: clientServices.messageBus,
            appConfig: portalAppSetup.appConfig,
        },
    });

    return {
        willBeRemoved: () => {
            app.$destroy();
        }
    };
};

(global as any).startSvelteDemoApp = bootstrap;
