
import context from '../context/global_portal_context';
import {PORTAL_INTERNAL_PATH} from '../constants';

import type {Request} from 'express';
import type {MashroomVHostPathMapperService} from '@mashroom/mashroom-vhost-path-mapper/type-definitions';

export const getPortalPath = () => {
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

export const getFrontendSiteBasePath = (req: Request): string => {
    const pathMapperService: MashroomVHostPathMapperService = req.pluginContext.services.vhostPathMapper && req.pluginContext.services.vhostPathMapper.service;
    const vhostMappingInfo = pathMapperService && pathMapperService.getMappingInfo(req);
    if (vhostMappingInfo) {
        return vhostMappingInfo.frontendBasePath !== '/' ? vhostMappingInfo.frontendBasePath : '';
    }
    return `${getPortalPath()}${getSitePath(req)}`;
};

export const getFrontendApiResourcesBasePath = (req: Request): string => {
    return `${getFrontendSiteBasePath(req)}${PORTAL_INTERNAL_PATH}`;
};
