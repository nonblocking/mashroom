
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer'
import App from './App';

const bootstrap = async (portalAppSetup) => {
    const { resourcesBasePath, appConfig: { message, pingButtonLabel }} = portalAppSetup;
    const dummyMessageBus = {};

    const app = createSSRApp(App, {
        resourcesBasePath,
        message,
        pingButtonLabel,
        messageBus: dummyMessageBus,
    });

    return renderToString(app);
};

export default bootstrap;
