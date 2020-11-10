// @flow

import SSE from 'express-sse';
import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalPluginRegistry, MashroomPortalRegisterListener} from '../../type-definitions/internal';

let sse: any;

const registerListener: MashroomPortalRegisterListener = (type, event) => {
    if (sse) {
        sse.send({ type, event });
    }
};

export const startPushPluginUpdates = (pluginRegistry: MashroomPortalPluginRegistry) => {
    sse = new SSE(['array', 'containing', 'initial', 'content', '(optional)'], { isSerialized: false, initialEvent: 'optional initial event name' });
    pluginRegistry.addRegisterListener(registerListener);
};

export const stopPushPluginUpdates = (pluginRegistry: MashroomPortalPluginRegistry) => {
    pluginRegistry.removeRegisterListener(registerListener);
};

export const getPortalPushPluginUpdatesRoute = () => (request: ExpressRequest, response: ExpressResponse) => {
    if (sse) {
        // express-see uses res.flush() (https://github.com/dpskvn/express-sse/blob/master/index.js#L70) which was removed in Node 14
        //  for compatibility with Node >= 14 add it to the response
        // $FlowFixMe
        if (typeof (response.flush) !== 'function') {
            // $FlowFixMe
            response.flush = response.flushHeaders;
        }

        sse.init(request, response);
    }
};

