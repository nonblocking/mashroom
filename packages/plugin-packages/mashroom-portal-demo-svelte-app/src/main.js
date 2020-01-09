// @flow
import App from './App.svelte';
import type { MashroomPortalAppPluginBootstrapFunction } from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    portalAppHostElement.innerHTML = '';
    const app = new App({
        target: portalAppHostElement,
        props: {
            messageBus: clientServices.messageBus,
            appConfig: portalAppSetup.appConfig,
        },
    });
};

window.startSvelteDemoApp = bootstrap;
