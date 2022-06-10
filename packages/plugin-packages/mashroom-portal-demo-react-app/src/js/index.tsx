
import '../sass/style.scss';

import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appConfig, user} = portalAppSetup;
    const {messageBus, remoteLogger} = clientServices;

    const root = createRoot(portalAppHostElement);
    root.render(<App appConfig={appConfig} messageBus={messageBus}/>);

    // Log on server
    remoteLogger?.info(`React Demo App started by user ${user.username}`);

    return {
        willBeRemoved: () => {
            console.info('Ummounting React app');
            root.unmount();
        }
    };
};

(global as any).startReactDemoApp = bootstrap;
