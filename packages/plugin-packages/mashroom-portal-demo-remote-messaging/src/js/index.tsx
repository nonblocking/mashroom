
import '../sass/style.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import RemoteMessagingApp from './components/RemoteMessagingApp';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { lang } = portalAppSetup;
    const { messageBus } = clientServices;

    ReactDOM.render(
        <RemoteMessagingApp lang={lang} messageBus={messageBus} />,
        portalAppHostElement);

    return {
        willBeRemoved: () => {
            ReactDOM.unmountComponentAtNode(portalAppHostElement)
        }
    };
};

(global as any).startRemoteMessagingDemoApp = bootstrap;
