
import '../sass/style.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup) => {
    const {lang, restProxyPaths} = portalAppSetup;

    ReactDOM.render(
        <App lang={lang} spaceXApiPath={restProxyPaths.spaceXApi}/>,
        portalAppHostElement);

    return {
        willBeRemoved: () => {
            ReactDOM.unmountComponentAtNode(portalAppHostElement);
        }
    };
};

(global as any).startRestProxyDemoApp = bootstrap;
