
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import App from './App.vue';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async (portalAppSetup) => {
    const { resourcesBasePath, appConfig: { message, pingButtonLabel }} = portalAppSetup;

    const app = createSSRApp(App, {
        resourcesBasePath,
        message,
        pingButtonLabel,
    });

    return renderToString(app);
};

export default bootstrap;
