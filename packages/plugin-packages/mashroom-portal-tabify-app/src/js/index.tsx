
import '../sass/style.scss';

import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { pluginName, appConfig } = portalAppSetup;
    const { portalAppService, messageBus } = clientServices;

    const root = createRoot(portalAppHostElement);
    root.render(
        <App
            hostElement={portalAppHostElement}
            tabifyPluginName={pluginName} appConfig={appConfig}
            portalAppService={portalAppService}
            messageBus={messageBus}
        />,
    );

    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startPortalTabifyApp = bootstrap;
