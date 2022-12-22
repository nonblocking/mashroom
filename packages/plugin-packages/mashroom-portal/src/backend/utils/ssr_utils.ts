
import {createHash} from 'crypto';
import fetch from 'node-fetch';
import context from '../context/global_portal_context';
import {SERVER_SIDE_RENDERED_EMBEDDED_APP_INSTANCE_ID_PREFIX} from '../constants';
import {getUser, isAppPermitted} from './security_utils';
import {getResourceAsString} from './resource_utils';
import {createPortalAppSetup} from './create_portal_app_setup';

import type {MashroomCDNService} from '@mashroom/mashroom-cdn/type-definitions';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {Request} from 'express';
import type {MashroomMemoryCacheService} from '@mashroom/mashroom-memory-cache/type-definitions';
import type {
    MashroomPortalAppSetup,
    MashroomPortalService,
    MashroomPortalAppCaching,
    MashroomPortalAppPluginSSRBootstrapFunction,
    MashroomPortalApp,
    MashroomPortalAppSSRRemoteRequest,
    MashroomPortalAppSSRResult,
    MashroomPortalAppSSRResultEmbeddedApps,
} from '../../../type-definitions';
import type {
    MashroomPortalIncludeStyleServerSideRenderedAppsResult,
    SSRRenderResult,
    MashroomPortalPageApps,
} from '../../../type-definitions/internal';

type RenderEmbeddedPortalAppsResult = {
    readonly resultHtml: string;
    readonly embeddedPortalPageApps: MashroomPortalPageApps;
}
type RenderEmbeddedPortalAppsFn = (hostHtml: string, portalPageApps: MashroomPortalPageApps) => Promise<RenderEmbeddedPortalAppsResult>;

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

const recursivelyRenderEmbeddedApps = async (rootAppHtml: string, embeddedApps: MashroomPortalAppSSRResultEmbeddedApps, renderEmbeddedPortalAppsFn: RenderEmbeddedPortalAppsFn, req: Request, logger: MashroomLogger): Promise<RenderEmbeddedPortalAppsResult> => {
    const pluginRegistry = context.pluginRegistry;
    const cdnService: MashroomCDNService | undefined = req.pluginContext.services.cdn?.service;
    const mashroomSecurityUser = await getUser(req);

    const embeddedPortalPageApps: MashroomPortalPageApps = {};
    for (const {pluginName, appAreaId, appConfig} of embeddedApps) {
        logger.debug(`Adding server-side embedded Portal App '${pluginName}' to areaId: ${appAreaId}`);

        const portalApp = pluginRegistry.portalApps.find((app) => app.name === pluginName);
        if (!portalApp) {
            logger.error(`Portal App not found: ${pluginName}`);
            continue;
        }

        if (!await isAppPermitted(req, pluginName, null, portalApp)) {
            logger.error(`User '${mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous'}' is not allowed to access Portal App: ${pluginName}`);
            continue;
        }

        const appSetup = await createPortalAppSetup(portalApp, null, appConfig, mashroomSecurityUser, cdnService, pluginRegistry, req);

        embeddedPortalPageApps[appAreaId] = embeddedPortalPageApps[appAreaId] || [];
        embeddedPortalPageApps[appAreaId].push({
            pluginName,
            instanceId: `${SERVER_SIDE_RENDERED_EMBEDDED_APP_INSTANCE_ID_PREFIX}_${appSetup.appId}`,
            appSetup,
        });
    }

    const {resultHtml, embeddedPortalPageApps: embeddedSubPortalApps} = await renderEmbeddedPortalAppsFn(rootAppHtml, embeddedPortalPageApps);
    Object.keys(embeddedSubPortalApps).forEach((appAreaId) => {
        embeddedPortalPageApps[appAreaId] = embeddedPortalPageApps[appAreaId] || [];
        embeddedPortalPageApps[appAreaId].push(...embeddedSubPortalApps[appAreaId]);
    });

    return {
        resultHtml,
        embeddedPortalPageApps,
    };
};

const renderServerSideWithCache = async (pluginName: string, portalApp: MashroomPortalApp, portalAppSetup: MashroomPortalAppSetup, renderEmbeddedPortalAppsFn: RenderEmbeddedPortalAppsFn, req: Request, logger: MashroomLogger): Promise<SSRRenderResult | null> => {
    const {cacheEnable, cacheTTLSec} = context.portalPluginConfig.ssrConfig;
    const cacheService: MashroomMemoryCacheService = req.pluginContext.services.memorycache?.service;
    const {ssrBootstrap: ssrBootstrapPath, ssrInitialHtmlUri, cachingConfig} = portalApp;

    const cacheKey = cacheEnable && cacheService ? await getCacheKey(pluginName, portalAppSetup, cachingConfig, req) : null;

    if (cacheKey) {
       const cachedHtml = await cacheService.get(CACHE_REGION, cacheKey);
       if (cachedHtml) {
           logger.debug('SSR cache hit for Portal App', pluginName);
           return cachedHtml as SSRRenderResult;
       }
    }

    let htmlOrSSRRenderResult: string | MashroomPortalAppSSRResult | null = null;
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
            htmlOrSSRRenderResult = await ssrBootstrap(portalAppSetup, req);
        } catch (e) {
            logger.error(`Loading or executing local SSR bootstrap '${ssrBootstrapPath}' for app '${pluginName}' failed!`, e);
        }
    } else if (ssrInitialHtmlUri) {
        // Remote App
        try {
            const request: MashroomPortalAppSSRRemoteRequest = {
                originalRequest: {
                    path: req.path,
                    queryParameters: req.query,
                },
                portalAppSetup
            };
            const result = await fetch(ssrInitialHtmlUri, {
                method: 'POST',
                body: JSON.stringify(request),
                headers: {'Content-Type': 'application/json'}
            });
            if (result.ok) {
                const contentType = result.headers.get('Content-Type');
                if (contentType && contentType.indexOf('/json') !== -1) {
                    htmlOrSSRRenderResult = await result.json();
                } else {
                    htmlOrSSRRenderResult = await result.text();
                }
            } else {
                logger.error(`Fetching HTML from remote SSR route '${ssrInitialHtmlUri}' for app '${pluginName} failed! HTTP status: ${result.status}`);
            }
        } catch (e) {
            logger.error(`Fetching HTML from remote SSR route '${ssrInitialHtmlUri}' for app '${pluginName}' failed!`, e);
        }
    }

    let html;
    let embeddedApps: MashroomPortalAppSSRResultEmbeddedApps = [];
    let embeddedPortalPageApps: MashroomPortalPageApps ={};

    if (typeof htmlOrSSRRenderResult === 'string') {
        html = htmlOrSSRRenderResult;
    } else if (htmlOrSSRRenderResult && 'html' in htmlOrSSRRenderResult) {
        html = htmlOrSSRRenderResult.html;
        embeddedApps = htmlOrSSRRenderResult.embeddedApps ?? [];
    }

    if (!html) {
        return null;
    }

    if (embeddedApps.length > 0) {
        const embeddedAppsRenderResult = await recursivelyRenderEmbeddedApps(html, embeddedApps, renderEmbeddedPortalAppsFn, req, logger);
        html = embeddedAppsRenderResult.resultHtml;
        embeddedPortalPageApps = embeddedAppsRenderResult.embeddedPortalPageApps;
    }

    const ssrRenderResult: SSRRenderResult = {
        html,
        embeddedPortalPageApps,
    };

    if (html && cacheKey) {
        // We deliberately don't wait
        cacheService.set(CACHE_REGION, cacheKey, ssrRenderResult, cacheTTLSec);
    }

    return ssrRenderResult;
};

export const renderServerSide = async (pluginName: string, portalAppSetup: MashroomPortalAppSetup, renderEmbeddedPortalAppsFn: RenderEmbeddedPortalAppsFn, req: Request, logger: MashroomLogger, ignoreTimeout = false): Promise<SSRRenderResult | null> => {
    const ssrConfig = context.portalPluginConfig.ssrConfig;
    if (!ssrConfig.ssrEnable) {
        return null;
    }

    const portalService: MashroomPortalService = req.pluginContext.services.portal!.service;
    const portalApp = portalService.getPortalApps().find(({name}) => name === pluginName);
    if (!portalApp || (!portalApp.ssrBootstrap && !portalApp.ssrInitialHtmlUri)) {
        return null;
    }

    if (ignoreTimeout) {
        return renderServerSideWithCache(pluginName, portalApp, portalAppSetup, renderEmbeddedPortalAppsFn, req, logger);
    }

    let timeout: any;
    return Promise.race([
        renderServerSideWithCache(pluginName, portalApp, portalAppSetup, renderEmbeddedPortalAppsFn, req, logger),
        new Promise<null>((resolve) => timeout = setTimeout(() => resolve(null), ssrConfig.renderTimoutMs)),
    ]).then((result) => {
        clearTimeout(timeout);
        return result;
    });
};

export const renderInlineStyleForServerSideRenderedApps = async (serverSideRenderedApps: Array<string>, req: Request, logger: MashroomLogger): Promise<MashroomPortalIncludeStyleServerSideRenderedAppsResult> => {
    const ssrConfig = context.portalPluginConfig.ssrConfig;
    if (!ssrConfig.ssrEnable || serverSideRenderedApps.length === 0) {
        return {
            headerContent: '',
            includedAppStyles: [],
        };
    }

    const includedAppStyles: Array<string> = [];
    const portalService: MashroomPortalService = req.pluginContext.services.portal!.service;

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

            let timeout: any;
            const styles = await Promise.race([
                Promise.all(portalAppStyleResourcePromises),
                new Promise<[]>((resolve) => timeout = setTimeout(() => resolve([]), ssrConfig.renderTimoutMs)),
            ]).then((result) => {
                clearTimeout(timeout);
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
    };
};

