
import '../sass/style.scss';

import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup) => {
    const {lang, proxyPaths} = portalAppSetup;

    const root = createRoot(portalAppHostElement);
    root.render(<App lang={lang} rocketLaunchApi={proxyPaths.rocketLaunchApi}/>);

    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startRestProxyDemoApp = bootstrap;
