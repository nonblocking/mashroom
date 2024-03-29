import {PORTAL_PAGE_ENHANCEMENT_RESOURCES_BASE_PATH} from '../constants';
import {getResourceAsString} from './resource-utils';
import {getFrontendResourcesBasePath} from './path-utils';
import {getVersionHash} from './cache-utils';

import type {Request} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomCDNService} from '@mashroom/mashroom-cdn/type-definitions';
import type {
    MashroomPortalPageEnhancement,
    MashroomPortalPageEnhancementResource,
    UserAgent
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';

type RelevantEnhancements = {
    js: Array<{
        pageEnhancement: MashroomPortalPageEnhancement;
        resource: MashroomPortalPageEnhancementResource;
    }>;
    css: Array<{
        pageEnhancement: MashroomPortalPageEnhancement;
        resource: MashroomPortalPageEnhancementResource;
    }>;
}

export const getPageEnhancementResources = async (pluginRegistry: MashroomPortalPluginRegistry, location: 'header' | 'footer', sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, req: Request): Promise<string> => {
    const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.portal');
    let enhancement = '';

    const relevantEnhancements = await getRelevantPageEnhancements(pluginRegistry, location, sitePath, pageFriendlyUrl, lang, userAgent, req);

    for (let j = 0; j < relevantEnhancements.js.length; j++) {
        const {pageEnhancement, resource: jsResource} = relevantEnhancements.js[j];
        logger.debug(`Adding JS page resource to the ${location}:`, jsResource);
        enhancement += await getPageEnhancementResource('js', pageEnhancement, jsResource, sitePath, pageFriendlyUrl, lang, userAgent, req, logger);
    }
    for (let j = 0; j < relevantEnhancements.css.length; j++) {
        const {pageEnhancement, resource: cssResource} = relevantEnhancements.css[j];
        logger.debug(`Adding CSS page resource to the ${location}:`, cssResource);
        enhancement += await getPageEnhancementResource('css', pageEnhancement, cssResource, sitePath, pageFriendlyUrl, lang, userAgent, req, logger);
    }

    return enhancement;
};

export const allEnhancementsExistOnOriginalPage = async (pluginRegistry: MashroomPortalPluginRegistry, sitePath: string,
                                                        pageFriendlyUrl: string, originalPageFriendlyUrl: string, lang: string,
                                                        userAgent: UserAgent, req: Request): Promise<boolean> => {
    const originalPageHeader = await getRelevantPageEnhancements(pluginRegistry, 'header', sitePath, originalPageFriendlyUrl, lang, userAgent, req);
    const pageHeader = await getRelevantPageEnhancements(pluginRegistry, 'header', sitePath, pageFriendlyUrl, lang, userAgent, req);
    const originalPageFooter = await getRelevantPageEnhancements(pluginRegistry, 'footer', sitePath, originalPageFriendlyUrl, lang, userAgent, req);
    const pageFooter = await getRelevantPageEnhancements(pluginRegistry, 'footer', sitePath, pageFriendlyUrl, lang, userAgent, req);

    const originalPageEnhancements = [...originalPageHeader.js, ...originalPageHeader.css, ...originalPageFooter.js, ...originalPageFooter.css];
    const pageEnhancements = [...pageHeader.js, ...pageHeader.css, ...pageFooter.js, ...pageFooter.css];

    // The page enhancement resources need to be same instances, if the enhancement plugin was reloaded its no longer the same
    return pageEnhancements.every((pageEnhancement) => {
        return !!originalPageEnhancements.find((cpe) => pageEnhancement.resource === cpe.resource);
    });
};

const getRelevantPageEnhancements = async (pluginRegistry: MashroomPortalPluginRegistry, location: 'header' | 'footer', sitePath: string, pageFriendlyUrl: string,
                                           lang: string, userAgent: UserAgent, req: Request): Promise<RelevantEnhancements> => {
    const enhancements: RelevantEnhancements = {
        css: [],
        js: [],
    };

    const portalPageEnhancements = [...pluginRegistry.portalPageEnhancements];
    // Sort according to "order" property
    portalPageEnhancements.sort((enhancement1, enhancement2) => enhancement1.order < enhancement2.order ? -1 : 1);

    for (let i = 0; i < portalPageEnhancements.length; i++) {
        const pageEnhancement = portalPageEnhancements[i];
        if (pageEnhancement.pageResources && Array.isArray(pageEnhancement.pageResources.js)) {
            for (let j = 0; j < pageEnhancement.pageResources.js.length; j++) {
                const jsResource = pageEnhancement.pageResources.js[j];
                if (pageEnhancementResourceShallInclude(location, pageEnhancement, jsResource, sitePath, pageFriendlyUrl, lang, userAgent, req)) {
                    enhancements.js.push({
                        pageEnhancement,
                        resource: jsResource,
                    });
                }
            }
        }
        if (pageEnhancement.pageResources && Array.isArray(pageEnhancement.pageResources.css)) {
            for (let j = 0; j < pageEnhancement.pageResources.css.length; j++) {
                const cssResource = pageEnhancement.pageResources.css[j];
                if (pageEnhancementResourceShallInclude(location, pageEnhancement, cssResource, sitePath, pageFriendlyUrl, lang, userAgent, req)) {
                    enhancements.css.push({
                        pageEnhancement,
                        resource: cssResource,
                    });
                }
            }
        }
    }

    return enhancements;
};

const getPageEnhancementResource = async (type: 'js' | 'css', enhancement: MashroomPortalPageEnhancement, resource: MashroomPortalPageEnhancementResource, sitePath: string,
                                          pageFriendlyUrl: string, lang: string, userAgent: UserAgent, req: Request, logger: MashroomLogger): Promise<string> => {
    const cdnService: MashroomCDNService | undefined = req.pluginContext.services.cdn?.service;
    const {path: resourcePath, dynamicResource} = resource;
    const devMode = req.pluginContext.serverInfo.devMode;
    const versionHash = getVersionHash(enhancement.version, enhancement.lastReloadTs, devMode);
    if (!resource.inline && resourcePath) {
        if (type === 'js') {
            return `
                <script src="${getFrontendResourcesBasePath(req, cdnService?.getCDNHost())}${PORTAL_PAGE_ENHANCEMENT_RESOURCES_BASE_PATH}/${encodeURIComponent(enhancement.name)}/${resourcePath}?v=${versionHash}"></script>
            `;
        } else {
            return `
                <link rel="stylesheet" href="${getFrontendResourcesBasePath(req, cdnService?.getCDNHost())}${PORTAL_PAGE_ENHANCEMENT_RESOURCES_BASE_PATH}/${encodeURIComponent(enhancement.name)}/${resourcePath}?v=${versionHash}" />
            `;
        }
    } else {
        let resourceAsString;
        if (resourcePath) {
            const resourceUri = `${enhancement.resourcesRootUri}/${resourcePath}`;
            try {
                resourceAsString = await getResourceAsString(resourceUri, logger);
            } catch (e) {
                logger.error(`Error loading page resource: ${resourceUri}`, e);
            }
        } else if (dynamicResource) {
            // Dynamic resource
            if (enhancement.plugin && enhancement.plugin.dynamicResources && typeof (enhancement.plugin.dynamicResources[dynamicResource]) === 'function') {
                try {
                    resourceAsString = enhancement.plugin.dynamicResources[dynamicResource](sitePath, pageFriendlyUrl, lang, userAgent, req);
                } catch (e) {
                    logger.error(`Generating dynamic page resource failed: ${dynamicResource}`, e);
                }
            } else {
                logger.warn(`No dynamicResource '${dynamicResource}' defined in page enhancement plugin ${enhancement.name}`);
            }
        }
        if (resourceAsString) {
            if (type === 'js') {
                return `
                <script>
                    ${resourceAsString}
                </script>
            `;
            } else {
                return `
                <style>
                    ${resourceAsString}
                </style>
            `;
            }
        }
    }

    return '';
};

const pageEnhancementResourceShallInclude = (location: 'header' | 'footer', enhancement: MashroomPortalPageEnhancement, resource: MashroomPortalPageEnhancementResource,
                                             sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, req: Request): boolean => {
    const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.portal');

    if ((resource.location || 'header') !== location) {
        return false;
    }

    if (!resource.rule) {
        return true;
    }

    if (!enhancement.plugin || !enhancement.plugin.rules || typeof (enhancement.plugin.rules[resource.rule]) !== 'function') {
        logger.warn(`No rule '${resource.rule}' defined in page enhancement plugin ${enhancement.name}`);
        return false;
    }

    try {
        return enhancement.plugin.rules[resource.rule](sitePath, pageFriendlyUrl, lang, userAgent, req);
    } catch (e) {
        logger.error(`Executing rule '${resource.rule}' in page enhancement plugin ${enhancement.name} failed!`, e);
    }
    return false;
};
