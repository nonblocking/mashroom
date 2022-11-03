
import '../sass/style.scss';

import React from 'react';
import {createRoot, hydrateRoot, type Root} from 'react-dom/client';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appId, appConfig} = portalAppSetup;
    const {messageBus, portalAppService} = clientServices;

    const ssrHost = portalAppHostElement.querySelector('[data-ssr-host="true"]');

    let root: Root;
    if (ssrHost) {
        // SSR
        console.info('Hydrating Demo Composite App');
        root = hydrateRoot(ssrHost, <App appId={appId} messageBus={messageBus} portalAppService={portalAppService}/>);
    } else {
        // CSR
        console.info('Starting Demo Composite App');
        root = createRoot(portalAppHostElement);
        root.render(<App appId={appId} messageBus={messageBus} portalAppService={portalAppService}/>);
    }

    return {
        willBeRemoved: () => {
            console.info('Unmounting Demo Composite App');
            root.unmount();
        }
    };
};

(global as any).startCompositeDemoApp = bootstrap;
