
import React from 'react';
import {renderToString} from 'react-dom/server';
import App from './App';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async (portalAppSetup, clientServices) => {
    const {appConfig: {markdownMessage, pingButtonLabel}} = portalAppSetup;
    const {messageBus} = clientServices;
    return renderToString(
        <div data-ssr-host="true">
            <App markdownMessage={markdownMessage} pingButtonLabel={pingButtonLabel} messageBus={messageBus}/>
        </div>
    );
};

export default bootstrap;
