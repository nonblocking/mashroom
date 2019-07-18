// @flow

import '../sass/style.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { pluginName, appConfig } = portalAppSetup;
    const { portalAppService, messageBus } = clientServices;

    ReactDOM.render(
        <App hostElement={portalAppHostElement} tabifyPluginName={pluginName} appConfig={appConfig} portalAppService={portalAppService} messageBus={messageBus}/>,
        portalAppHostElement);

    return {
        willBeRemoved: () => {
            ReactDOM.unmountComponentAtNode(portalAppHostElement)
        }
    };
};

global.startPortalTabifyApp = bootstrap;
