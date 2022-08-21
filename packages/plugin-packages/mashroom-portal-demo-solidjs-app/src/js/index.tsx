import '../sass/style.scss';

import {render} from 'solid-js/web';
import App from './App';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appConfig, user} = portalAppSetup;
    const {messageBus} = clientServices;

    // Solid does not remove all existing children
    portalAppHostElement.innerHTML = '';

    const dispose = render(() => (
        <App appConfig={appConfig} messageBus={messageBus}/>
    ), portalAppHostElement);

    return {
        willBeRemoved: () => {
            console.info('Unmounting SolidJS App');
            dispose();
        }
    };
};

(global as any).startSolidJSDemoApp = bootstrap;
