
import '../sass/style.scss';

import React from 'react';
import {render, unmountComponentAtNode} from 'react-dom';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appConfig, user} = portalAppSetup;
    const {messageBus, portalAppService} = clientServices;

    render(<App messageBus={messageBus} portalAppService={portalAppService}/>, portalAppHostElement);

    return {
        willBeRemoved: () => {
            console.info('Ummounting React app');
            unmountComponentAtNode(portalAppHostElement);
        }
    };
};

(global as any).startCompositeDemoApp = bootstrap;
