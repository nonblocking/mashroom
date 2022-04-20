
import React from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import App from './components/App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    render(
        <App lang={portalAppSetup.lang}
             userName={portalAppSetup.user.username}
             portalAppService={clientServices.portalAppService}
             portalAdminService={clientServices.portalAdminService}
             portalUserService={clientServices.portalUserService}
             portalSiteService={clientServices.portalSiteService}
        />,
        portalAppHostElement);

    return {
        willBeRemoved: () => {
            unmountComponentAtNode(portalAppHostElement);
        }
    };
};

(global as any).startPortalAdminApp = bootstrap;
