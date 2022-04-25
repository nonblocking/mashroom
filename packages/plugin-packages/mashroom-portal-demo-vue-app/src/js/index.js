
import { createApp } from 'vue';
import App from './App.vue';

const bootstrap = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { resourcesBasePath, appConfig: { message, pingButtonLabel }} = portalAppSetup;
    const { messageBus } = clientServices;

    const app = createApp(App, {
        resourcesBasePath,
        message,
        pingButtonLabel,
        messageBus
    });

    app.mount(portalAppHostElement);

    return {
        willBeRemoved: () => {
            console.info('Destroying Vue app');
            app.unmount();
        }
    };
};

global.startVueDemoApp = bootstrap;
