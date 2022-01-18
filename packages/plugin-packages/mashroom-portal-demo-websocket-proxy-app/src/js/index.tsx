
import '../sass/style.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup) => {
    const {restProxyPaths} = portalAppSetup;

    ReactDOM.render(<App echoWSPath={restProxyPaths.echo}/>, portalAppHostElement);

    return {
        willBeRemoved: () => {
            ReactDOM.unmountComponentAtNode(portalAppHostElement);
        }
    };
};

(global as any).startWebSocketProxyDemoApp = bootstrap;
