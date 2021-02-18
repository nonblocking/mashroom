
import IFrameApp from './IFrameApp';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { appConfig: { url, width, defaultHeight } } = portalAppSetup;
    const app = new IFrameApp(url, width, defaultHeight);

    return app.mount(portalAppHostElement).then(
        () => ({
            willBeRemoved: () => {
                app.unmount();
            }
        })
    );
};

(global as any).startPortalIFrameApp = bootstrap;
