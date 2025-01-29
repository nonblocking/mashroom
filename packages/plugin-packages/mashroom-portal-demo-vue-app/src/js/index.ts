
import { createApp, createSSRApp } from 'vue';
import App from './App.vue';
import type { App as AppType } from 'vue';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { serverSideRendered, resourcesBasePath, appConfig: { message, pingButtonLabel }} = portalAppSetup;
    const { messageBus } = clientServices;

    let app: AppType;
    if (serverSideRendered) {
        // SSR
        console.info('Hydrating Vue Demo App');
        app = createSSRApp(App, {
            resourcesBasePath,
            message,
            pingButtonLabel,
            messageBus
        });
        app.mount(portalAppHostElement);
    } else {
        // CSR
        console.info('Starting Vue Demo App');
        app = createApp(App, {
            resourcesBasePath,
            message,
            pingButtonLabel,
            messageBus
        });
        app.mount(portalAppHostElement);
    }

    return {
        willBeRemoved: () => {
            console.info('Unmounting Vue Demo App');
            app.unmount();
        }
    };
};

(global as any).startVueDemoApp = bootstrap;
