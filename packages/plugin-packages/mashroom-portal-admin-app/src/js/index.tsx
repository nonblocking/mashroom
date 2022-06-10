
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './components/App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const root = createRoot(portalAppHostElement);
    root.render(
        <App lang={portalAppSetup.lang}
             userName={portalAppSetup.user.username}
             portalAppService={clientServices.portalAppService}
             portalAdminService={clientServices.portalAdminService}
             portalUserService={clientServices.portalUserService}
             portalSiteService={clientServices.portalSiteService}
        />,
    );

    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startPortalAdminApp = bootstrap;
