
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    ReactDOM.render(
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
            ReactDOM.unmountComponentAtNode(portalAppHostElement);
        }
    };
};

(global as any).startPortalAdminApp = bootstrap;
