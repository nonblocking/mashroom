
import '../sass/styleApp.scss';

import React from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import App from './App';

import type {Root} from 'react-dom/client';
import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {serverSideRendered, appConfig: {markdownMessage, pingButtonLabel}, user} = portalAppSetup;
    const {messageBus, remoteLogger} = clientServices;

    let root: Root;
    if (serverSideRendered) {
        // SSR
        console.info('Hydrating React Demo App 2');
        root = hydrateRoot(portalAppHostElement, (
            <App markdownMessage={markdownMessage} pingButtonLabel={pingButtonLabel} messageBus={messageBus}/>
        ));
    } else {
        // CSR
        console.info('Starting React Demo App 2');
        root = createRoot(portalAppHostElement);
        root.render((
            <App markdownMessage={markdownMessage} pingButtonLabel={pingButtonLabel} messageBus={messageBus}/>
        ));
    }

    // Log on server
    remoteLogger?.info(`React Demo App 2 started by user ${user.username}`);

    return {
        willBeRemoved: () => {
            console.info('Unmounting React App 2');
            root.unmount();
        },
        updateAppConfig: ({markdownMessage, pingButtonLabel}) => {
            console.info('Re-rending React App 2 because appConfig changed');
            root.unmount();
            root = createRoot(portalAppHostElement);
            root.render(<App markdownMessage={markdownMessage} pingButtonLabel={pingButtonLabel} messageBus={messageBus}/>);
        },
    };
};

(global as any).startReactDemoApp2 = bootstrap;
