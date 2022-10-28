
import React from 'react';
import {renderToString} from 'react-dom/server';
import App from './App';
import DIALOG from './dialog';
import {getDialogElementId} from './utils';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
import type {SSRPreloadedState} from './types';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async (portalAppSetup, clientServices, req) => {
    const logger = req.pluginContext.loggerFactory('demo.composite.app');
    const {appId} = portalAppSetup;
    const {portalAppService, messageBus} = clientServices;
    const dialogElementId = getDialogElementId(appId);

    let html = renderToString(<App appId={appId} portalAppService={portalAppService} messageBus={messageBus}/>);

    // Add SSR HTML of the first App
    const dialogIdx = 0;
    const firstApp = DIALOG[dialogIdx];
    try {
        const {appId: embeddedAppId, appSSRHtml: embeddedAppSSRHtml} = await portalAppService.serverSideRenderApp(dialogElementId, firstApp.name, firstApp.appConfig);
        // Embed the first dialog App
        html = html.replace(/(class="dialog">)(<)/, `$1${embeddedAppSSRHtml}$2`);
        console.info('!!!', html);
        const preloadedState: SSRPreloadedState = {
            activeApp: {
                dialogIdx,
                appId: embeddedAppId,
            },
        };
        // Add preloaded state
        html = `
            <div>
                <script>
                    window['__PRELOADED_STATE_${appId}__'] = "${JSON.stringify(preloadedState).replace(/"/g, '\\"')}";
                </script>
                <div data-ssr-host="true">${html}</div>
            </div>
        `;
    } catch (e) {
        logger.error('Unable to server-side render: ', firstApp, e);
    }

    return html;
};

export default bootstrap;
