// @flow

import {DEFAULT_SITE_ID} from '../constants';

import type {
    ExpressRequest, MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalAppInstanceRef,
    MashroomPortalPage,
    MashroomPortalPageRef,
    MashroomPortalService,
    MashroomPortalSite,
} from '../../../type-definitions';

export const findPortalAppInstanceOnPage = (page: MashroomPortalPage, pluginName: string, instanceId: string): ?{ areaId: string, position: number, instance: MashroomPortalAppInstanceRef } => {

    const portalApps = page.portalApps;
    if (!portalApps) {
        return null;
    }

    let instance = null;
    let areaId = null;
    let position = null;
    for (const aId in portalApps) {
        const inst = portalApps[aId].find((a) => a.pluginName === pluginName && a.instanceId === instanceId);
        if (inst) {
            instance = inst;
            areaId = aId;
            position = portalApps[aId].indexOf(instance);
            break;
        }
    }

    if (!instance || !areaId || position === null) {
        return null;
    }

    return {
        areaId,
        position,
        instance,
    };
};

export const getPageData = async (sitePath: string, friendlyUrl: ?string, req: ExpressRequest, logger: MashroomLogger): Promise<{ site?: MashroomPortalSite, pageRef?: MashroomPortalPageRef, page?: MashroomPortalPage }> => {

    const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

    const site = await portalService.findSiteByPath(sitePath);
    if (!site) {
        return {};
    }

    let pageRef = null;
    if (friendlyUrl) {
        pageRef = await portalService.findPageRefByFriendlyUrl(site, friendlyUrl);
    }
    if (!pageRef && (!friendlyUrl || friendlyUrl === '/') && site.pages && site.pages.length > 0) {
        // Take first page
        pageRef = site.pages[0];
    }
    if (!pageRef) {
        logger.warn(`Page not found in site '${site.siteId}' configuration: ${friendlyUrl || '/'}`);
        return {};
    }

    const page = await portalService.getPage(pageRef.pageId);
    if (!page) {
        logger.warn(`Page '${pageRef.pageId}' not found in configuration: ${pageRef.pageId}`);
        return {};
    }

    return {site, pageRef, page};
};

export const getDefaultSite = async (req: ExpressRequest, logger: MashroomLogger): Promise<?MashroomPortalSite> => {
    const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

    const defaultSite = await portalService.getSite(DEFAULT_SITE_ID);
    if (defaultSite) {
        logger.info(`Determined default site: ${defaultSite.siteId}`);
        return defaultSite;
    }

    const siteRefs = await portalService.getSites(1);
    if (siteRefs && siteRefs.length > 0) {
        const siteRef = siteRefs[0];
        logger.info(`Determined default site: ${siteRef.siteId}`);
        return await portalService.getSite(siteRef.siteId);
    }

    logger.warn('No default site found!');
    return null;
};
