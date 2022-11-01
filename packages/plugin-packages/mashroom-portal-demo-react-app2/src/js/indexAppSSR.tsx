
import React from 'react';
import {renderToString} from 'react-dom/server';
import App from './App';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async (portalAppSetup) => {
    const {appConfig: {markdownMessage, pingButtonLabel}} = portalAppSetup;
    const fakeMessageBus: any = {};
    return renderToString(
        <div data-ssr-host="true">
            <App markdownMessage={markdownMessage} pingButtonLabel={pingButtonLabel} messageBus={fakeMessageBus}/>
        </div>
    );
};

export default bootstrap;
