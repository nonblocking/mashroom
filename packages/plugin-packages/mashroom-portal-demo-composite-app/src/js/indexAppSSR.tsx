
import React from 'react';
import {renderToString} from 'react-dom/server';
import App from './App';
import DIALOG from './dialog';
import {getDialogHostElementId} from './utils';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async (portalAppSetup, req) => {
    const {appId} = portalAppSetup;
    const dialogHostElementId = getDialogHostElementId(appId);
    const dummyPortalAppService: any = {};
    const dummyMessageBus: any = {};

    let html = renderToString(<App appId={appId} portalAppService={dummyPortalAppService} messageBus={dummyMessageBus}/>);
    html = `<div data-ssr-host="true">${html}</div>`;

    // Add SSR HTML of the first App
    const dialogIdx = 0;
    const firstApp = DIALOG[dialogIdx];

    return {
        html,
        embeddedApps: [
            {
                pluginName: firstApp.name,
                appConfig: firstApp.appConfig,
                appAreaId: dialogHostElementId,
            }
        ]
    };
};

export default bootstrap;
