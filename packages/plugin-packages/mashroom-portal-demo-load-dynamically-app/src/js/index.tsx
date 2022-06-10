
import '../sass/style.scss';

import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {portalAppService} = clientServices;

    const root = createRoot(portalAppHostElement);
    root.render(<App portalAppService={portalAppService}/>);

    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startLoadDynamicallyDemoApp = bootstrap;
