
import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './components/App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {

    // Some themes rely on data attributes (e.g., for dark mode) that needs to be added to dialogs as well
    const appWrapperDataAttributes: Record<string, string> = {};
    const wrappers = [portalAppHostElement.parentElement!, portalAppHostElement.parentElement!.parentElement!];
    wrappers.forEach((wrapper) => {
        wrapper.getAttributeNames().forEach((attrName) => {
            if (attrName.startsWith('data-')) {
                appWrapperDataAttributes[attrName] = wrapper.getAttribute(attrName) ?? '';
            }
        });
    });

    const root = createRoot(portalAppHostElement);
    root.render(
        <App
            lang={portalAppSetup.lang}
            userName={portalAppSetup.user.username}
            portalAppService={clientServices.portalAppService}
            portalAdminService={clientServices.portalAdminService}
            portalUserService={clientServices.portalUserService}
            portalSiteService={clientServices.portalSiteService}
            appWrapperDataAttributes={appWrapperDataAttributes}
        />,
    );

    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startPortalAdminApp = bootstrap;
