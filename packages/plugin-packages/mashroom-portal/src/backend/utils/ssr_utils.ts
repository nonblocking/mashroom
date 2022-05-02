
import {setTimeout} from 'timers/promises';
import {createHash} from 'crypto';
import fetch from 'node-fetch';
import context from '../context/global_portal_context'
import {getUser} from './security_utils';
import {getResourceAsString} from './resource_utils';

import type {Request} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomMemoryCacheService} from '@mashroom/mashroom-memory-cache/type-definitions';
import type {
    MashroomPortalAppSetup,
    MashroomPortalService,
    MashroomPortalAppCaching,
    MashroomPortalAppPluginSSRBootstrapFunction,
    MashroomPortalApp
} from '../../../type-definitions';
import type {MashroomPortalIncludeStyleServerSideRenderedAppsResult} from '../../../type-definitions/internal';

const CACHE_REGION = 'mashroom-portal-ssr';

const getCacheKey = async (pluginName: string, portalAppSetup: MashroomPortalAppSetup, cachingConfig: MashroomPortalAppCaching | null | undefined, req: Request): Promise<string | null> => {
    const cachePolicy = cachingConfig?.ssrHtml || 'same-config-and-user';
    const mashroomSecurityUser = await getUser(req);

    let data = null;
    if (cachePolicy === 'same-config') {
        data = `${pluginName}___${JSON.stringify(portalAppSetup.appConfig)}`;
    } else if (cachePolicy === 'same-config-and-user') {
        data = `${pluginName}__${JSON.stringify(portalAppSetup.appConfig)}__${mashroomSecurityUser?.username}`;
    }

    return data ? createHash('sha256').update(data).digest('hex') : null;
};

const renderServerSideWithCache = async (pluginName: string, portalApp: MashroomPortalApp, portalAppSetup: MashroomPortalAppSetup, req: Request, logger: MashroomLogger): Promise<string | null> => {
    const {cacheEnable, cacheTTLSec} = context.portalPluginConfig.ssrConfig;
    const cacheService: MashroomMemoryCacheService = req.pluginContext.services.memorycache?.service;
    const {ssrBootstrap: ssrBootstrapPath, ssrInitialHtmlUri, cachingConfig} = portalApp;

    const cacheKey = cacheEnable && cacheService ? await getCacheKey(pluginName, portalAppSetup, cachingConfig, req) : null;

    if (cacheKey) {
       const cachedHtml = await cacheService.get(CACHE_REGION, cacheKey);
       if (cachedHtml) {
           logger.debug('SSR cache hit for Portal App', pluginName);
           return cachedHtml as string;
       }
    }

    let html = null;
    if (ssrBootstrapPath) {
        // Local App
        try {
            let ssrBootstrap: MashroomPortalAppPluginSSRBootstrapFunction;
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const bootstrap = require(ssrBootstrapPath);
            if (typeof (bootstrap) === 'function') {
                ssrBootstrap = bootstrap;
            } else {
                ssrBootstrap = bootstrap.default;
            }
            html = await ssrBootstrap(portalAppSetup, req);
        } catch (e) {
            logger.error(`Loading or executing local SSR bootstrap '${ssrBootstrapPath}' for app '${pluginName}' failed!`, e);
        }
    } else if (ssrInitialHtmlUri) {
        // Remote App
        try {
            const result = await fetch(ssrInitialHtmlUri, {
                method: 'POST',
                body: JSON.stringify({
                    portalAppSetup,
                }),
                headers: {'Content-Type': 'application/json'}
            });
            if (result.ok) {
                html = await result.text();
            } else {
                logger.error(`Fetching HTML from remote SSR route '${ssrInitialHtmlUri}' for app '${pluginName} failed! HTTP status: ${result.status}`);
            }
        } catch (e) {
            logger.error(`Fetching HTML from remote SSR route '${ssrInitialHtmlUri}' for app '${pluginName}' failed!`, e);
        }
    }

    if (html && cacheKey) {
        // We deliberately don't wait
        cacheService.set(CACHE_REGION, cacheKey, html, cacheTTLSec);
    }

    return html;
}

export const renderServerSide = async (pluginName: string, portalAppSetup: MashroomPortalAppSetup, req: Request, logger: MashroomLogger): Promise<string | null> => {
    const ssrConfig = context.portalPluginConfig.ssrConfig;
    if (!ssrConfig.ssrEnable) {
        return null;
    }

    const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
    const portalApp = portalService.getPortalApps().find(({name}) => name === pluginName);
    if (!portalApp || (!portalApp.ssrBootstrap && !portalApp.ssrInitialHtmlUri)) {
        return null;
    }

    const ac = new AbortController();
    return Promise.race([
        renderServerSideWithCache(pluginName, portalApp, portalAppSetup, req, logger),
        setTimeout(ssrConfig.renderTimoutMs, null, { signal: ac.signal }),
    ]).then((result) => {
        ac.abort();
        return result;
    })
}

export const renderInlineStyleForServerSideRenderedApps = async (serverSideRenderedApps: Array<string>, req: Request, logger: MashroomLogger): Promise<MashroomPortalIncludeStyleServerSideRenderedAppsResult> => {
    const ssrConfig = context.portalPluginConfig.ssrConfig;
    if (!ssrConfig.ssrEnable || serverSideRenderedApps.length === 0) {
        return {
            headerContent: '',
            includedAppStyles: [],
        };
    }

    const includedAppStyles: Array<string> = [];
    const portalService: MashroomPortalService = req.pluginContext.services.portal.service;

    const styleResources: Array<Array<string>> = await Promise.all(serverSideRenderedApps.map(async (pluginName) => {
        try {
            const portalApp = portalService.getPortalApps().find(({name}) => name === pluginName);
            if (!portalApp) {
                return [];
            }
            const portalAppStyleResources: Array<string> = [];
            if (portalApp.sharedResources?.css) {
                portalApp.sharedResources.css.forEach((resource) => portalAppStyleResources.push(resource));
            }
            if (portalApp.resources.css) {
                portalApp.resources.css.forEach((resource) => portalAppStyleResources.push(resource));
            }

            if (portalAppStyleResources.length === 0) {
                return [];
            }

            const portalAppStyleResourcePromises = portalAppStyleResources.map((resourcePath) => {
                const resourceUri = `${portalApp.resourcesRootUri}/${resourcePath}`;
                return getResourceAsString(resourceUri)
                    .catch((e) => {
                        logger.error(`Could not inline style '${resourceUri}'`, e);
                        return null;
                    });
            });

            const ac = new AbortController();
            const styles = await Promise.race([
                Promise.all(portalAppStyleResourcePromises),
                setTimeout(ssrConfig.renderTimoutMs, [], { signal: ac.signal }),
            ]).then((result) => {
                ac.abort();
                return result;
            });

            const validStyles = styles.filter((s) => !!s) as Array<string>;
            if (styles.length === validStyles.length) {
                includedAppStyles.push(pluginName);
            }

            return validStyles;
        } catch (e) {
            logger.error(`Could not inline style for Portal App: '${pluginName}'`, e);
        }
        return [];
    }));

    const headerContent = styleResources.flat().map((style) => (`
        <style>${style}</style>
    `)).join('\n');

    return {
        headerContent,
        includedAppStyles,
    }
}

