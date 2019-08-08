// @flow

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const { lang, appConfig: { name } } = portalAppSetup;
    const { messageBus } = clientServices;

    portalAppHostElement.style.padding = '20px';
    if (lang === 'de') {
        portalAppHostElement.innerHTML = `<strong>Hallo ${name}!</strong>`;
    } else {
        portalAppHostElement.innerHTML = `<strong>Hello ${name}!</strong>`;
    }

    messageBus.publish('hello', {
        dummyAppStarted: true
    });

    messageBus.subscribe('update', (data) => {
        if (data && data.content) {
            portalAppHostElement.innerHTML = data.content;
        }
    });
    messageBus.subscribe('send-me-something', (data) => {
        console.info('Received: ', data);
    });
};

global.startFoo = bootstrap;
