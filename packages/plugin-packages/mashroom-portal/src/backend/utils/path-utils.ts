
import context from '../context/global-portal-context';
import {PORTAL_INTERNAL_PATH} from '../constants';

import type {Request} from 'express';
import type {MashroomVHostPathMapperService} from '@mashroom/mashroom-vhost-path-mapper/type-definitions';

export const getPortalPath = (): string => {
    // We just take the path from the plugin config
    return context.portalPluginConfig.path;
};

export const getSitePath = (req: Request): string => {
    const sitePath = req.params.sitePath;
    if (sitePath) {
        return `/${sitePath}`;
    }
    return '';
};

export const getFrontendSiteBasePath = (req: Request, ignoreVhostMapping = false): string => {
    const pathMapperService: MashroomVHostPathMapperService = req.pluginContext.services.vhostPathMapper?.service;

    const siteBasePath = `${getPortalPath()}${getSitePath(req)}`;
    if (pathMapperService && !ignoreVhostMapping) {
        return pathMapperService.getFrontendUrl(req, siteBasePath);
    }

    return siteBasePath;
};

export const getFrontendApiBasePath = (req: Request): string => {
    return `${getFrontendSiteBasePath(req)}${PORTAL_INTERNAL_PATH}`;
};

export const getFrontendResourcesBasePath = (req: Request, cdnHost: string | undefined | null): string => {
    return `${cdnHost || ''}${getFrontendSiteBasePath(req, !!cdnHost)}${PORTAL_INTERNAL_PATH}`;
};
