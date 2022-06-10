
import '../sass/style.scss';

import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appConfig, user} = portalAppSetup;
    const {messageBus, portalAppService} = clientServices;

    const root = createRoot(portalAppHostElement);
    root.render(<App messageBus={messageBus} portalAppService={portalAppService}/>);

    return {
        willBeRemoved: () => {
            console.info('Ummounting React app');
            root.unmount();
        }
    };
};

(global as any).startCompositeDemoApp = bootstrap;
