// @flow

import context from '../context/global_portal_context';

import type {ExpressRequest as Request} from '@mashroom/mashroom/type-definitions';

export const getPortalPath = () => {
    // We just take the path from the plugin config
    return context.portalPluginConfig.path;
};

export const getSiteAndFriendlyUrl = (req: Request) => {
    if (!req.path || !req.path.startsWith('/') || req.path === '/') {
        return {
            sitePath: null,
            friendlyUrl: null,
        };
    }

    const pathParts = req.path.substr(1).split('/');
    const sitePath = '/' + pathParts[0];
    const friendlyUrl = '/' + (pathParts.length > 1 ? pathParts.slice(1).join('/') : '');

    return {
        sitePath,
        friendlyUrl,
    };
};
