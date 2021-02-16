
import SSE from 'express-sse-ts';

import type {Request, Response} from 'express';
import type {MashroomPortalPluginRegistry, MashroomPortalRegisterListener} from '../../type-definitions/internal';

let sse: SSE | undefined;

const registerListener: MashroomPortalRegisterListener = (type, event) => {
    if (sse) {
        sse.send(JSON.stringify({ type, event }));
    }
};

export const startPushPluginUpdates = (pluginRegistry: MashroomPortalPluginRegistry) => {
    sse = new SSE();
    pluginRegistry.addRegisterListener(registerListener);
};

export const stopPushPluginUpdates = (pluginRegistry: MashroomPortalPluginRegistry) => {
    pluginRegistry.removeRegisterListener(registerListener);
};

export const getPortalPushPluginUpdatesRoute = () => (request: Request, response: Response) => {
    if (sse) {
        sse.init(request, response, () => { /* stop processing */ });
    }
};

