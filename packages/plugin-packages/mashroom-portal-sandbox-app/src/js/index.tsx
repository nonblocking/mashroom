
import '../sass/style.scss';

import React from 'react';
import {createRoot} from 'react-dom/client';
import SandboxApp from './components/SandboxApp';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { lang } = portalAppSetup;
    const { messageBus, portalAppService, stateService } = clientServices;

    const root = createRoot(portalAppHostElement);
    root.render(
        <SandboxApp
            lang={lang}
            messageBus={messageBus}
            portalAppService={portalAppService}
            portalStateService={stateService}
        />
    );

    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startSandboxApp = bootstrap;
