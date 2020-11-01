// @flow

import SSE from 'express-sse';
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

export const getPortalPushPluginUpdatesRoute = () => {
    if (!sse) {
        return null;
    }
    return sse.init;
};

