
import { createApp, createSSRApp } from 'vue';
import App from './App.vue';

const bootstrap = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { resourcesBasePath, appConfig: { message, pingButtonLabel }} = portalAppSetup;
    const { messageBus } = clientServices;

    const ssrHost = portalAppHostElement.querySelector('[data-ssr-host="true"]');

    let app;
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
            console.info('Ummounting Vue Demo App');
            app.unmount();
        }
    };
};

global.startVueDemoApp = bootstrap;
