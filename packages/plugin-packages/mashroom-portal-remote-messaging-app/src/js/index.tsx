
import '../sass/style.scss';

import React from 'react';
import {createRoot} from 'react-dom/client';
import RemoteMessagingApp from './components/RemoteMessagingApp';
import {StoreProvider} from './store/useStore';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { lang } = portalAppSetup;
    const { messageBus } = clientServices;

    const root = createRoot(portalAppHostElement);
    root.render((
        <StoreProvider>
            <RemoteMessagingApp lang={lang} messageBus={messageBus} />
        </StoreProvider>
    ));

    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startRemoteMessagingApp = bootstrap;
