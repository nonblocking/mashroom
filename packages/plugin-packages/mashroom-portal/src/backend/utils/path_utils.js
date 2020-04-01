// @flow

import context from '../context/global_portal_context';
import {PORTAL_INTERNAL_PATH} from '../constants';

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';

export const getPortalPath = () => {
    // We just take the path from the plugin config
    return context.portalPluginConfig.path;
};

export const getSitePath = (req: ExpressRequest): string => {
    const sitePath = req.params.sitePath;
    if (sitePath) {
        return `/${sitePath}`;
    }
    return '';
};

export const getApiResourcesBaseUrl = (req: ExpressRequest): string => {
    const portalPath = getPortalPath();
    const sitePath = getSitePath(req);
    return `${portalPath}${sitePath}${PORTAL_INTERNAL_PATH}`;
};
