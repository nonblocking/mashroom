
import '../sass/style.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appConfig, user} = portalAppSetup;
    const {messageBus, remoteLogger} = clientServices;

    ReactDOM.render(<App appConfig={appConfig} messageBus={messageBus}/>, portalAppHostElement);

    // Log on server
    remoteLogger?.info(`React Demo App started by user ${user.username}`);

    return {
        willBeRemoved: () => {
            console.info('Ummounting React app');
            ReactDOM.unmountComponentAtNode(portalAppHostElement);
        }
    };
};

(global as any).startReactDemoApp = bootstrap;
