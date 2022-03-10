
import '../sass/styleApp.scss';

import React from 'react';
import {render, hydrate, unmountComponentAtNode} from 'react-dom';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appConfig: {markdownMessage, pingButtonLabel}, user} = portalAppSetup;
    const {messageBus, remoteLogger} = clientServices;

    const ssrHost = portalAppHostElement.querySelector('[data-ssr-host="true"]');

    if (ssrHost) {
        // SSR
        console.info('Hydrating React Demo App 2');
        hydrate(<App markdownMessage={markdownMessage} pingButtonLabel={pingButtonLabel} messageBus={messageBus}/>, ssrHost);
    } else {
        // CSR
        console.info('Starting React Demo App 2');
        render(<App markdownMessage={markdownMessage} pingButtonLabel={pingButtonLabel} messageBus={messageBus}/>, portalAppHostElement);
    }

    // Log on server
    remoteLogger?.info(`React Demo App 2 started by user ${user.username}`);

    return {
        willBeRemoved: () => {
            console.info('Ummounting React App 2');
            unmountComponentAtNode(portalAppHostElement);
        },
        updateAppConfig: ({markdownMessage, pingButtonLabel}) => {
            console.info('Rerending React App 2 because appConfig changed');
            unmountComponentAtNode(portalAppHostElement);
            render(<App markdownMessage={markdownMessage} pingButtonLabel={pingButtonLabel} messageBus={messageBus}/>, portalAppHostElement);
        },
    };
};

(global as any).startReactDemoApp2 = bootstrap;
