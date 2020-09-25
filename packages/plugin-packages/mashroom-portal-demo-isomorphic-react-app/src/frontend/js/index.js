// @flow

import '../sass/style.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    ReactDOM.hydrate(<App appConfig={portalAppSetup.appConfig} messageBus={clientServices.messageBus}/>, portalAppHostElement);

    return Promise.resolve({
        willBeRemoved: () => {
            console.info('Ummounting React app');
            ReactDOM.unmountComponentAtNode(portalAppHostElement)
        }
    });
};

global.startIsomorphicReactDemoApp = bootstrap;
