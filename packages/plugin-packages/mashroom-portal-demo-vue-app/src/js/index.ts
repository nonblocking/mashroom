
import { createApp, createSSRApp, App as AppType } from 'vue';
import App from './App.vue';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { resourcesBasePath, appConfig: { message, pingButtonLabel }} = portalAppSetup;
    const { messageBus } = clientServices;

    const ssrHost = portalAppHostElement.querySelector('[data-ssr-host="true"]');

    let app: AppType;
    if (ssrHost) {
        // SSR
        console.info('Hydrating Vue Demo App');
        app = createSSRApp(App, {
            resourcesBasePath,
            message,
            pingButtonLabel,
            messageBus
        });
        app.mount(ssrHost);
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
