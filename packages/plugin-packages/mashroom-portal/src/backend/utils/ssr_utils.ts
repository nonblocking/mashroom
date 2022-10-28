
import {createHash} from 'crypto';
import fetch from 'node-fetch';
import context from '../context/global_portal_context';
import {getUser, isAppPermitted} from './security_utils';
import {getResourceAsString} from './resource_utils';
import {createPortalAppSetup} from './create_portal_app_setup';

import type {Request} from 'express';
import type {MashroomCDNService} from '@mashroom/mashroom-cdn/type-definitions';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomMemoryCacheService} from '@mashroom/mashroom-memory-cache/type-definitions';
import type {
    MashroomPortalAppSetup,
    MashroomPortalService,
    MashroomPortalAppCaching,
    MashroomPortalAppPluginSSRBootstrapFunction,
    MashroomPortalApp,
    MashroomPortalAppService, MashroomPortalMessageBus,
} from '../../../type-definitions';
import type {MashroomPortalIncludeStyleServerSideRenderedAppsResult} from '../../../type-definitions/internal';

type WrapEmbeddedAppFn = (appSetup: MashroomPortalAppSetup, appAreaId: string, appSSRHtml: string) => Promise<string>;

const CACHE_REGION = 'mashroom-portal-ssr';

const serverSideRenderEmbeddedApp = (req: Request, wrapEmbeddedApp: WrapEmbeddedAppFn): MashroomPortalAppService['serverSideRenderApp'] =>
    async (appAreaId, pluginName, appConfig) => {

    const logger = req.pluginContext.loggerFactory('mashroom.portal');
    const pluginRegistry = context.pluginRegistry;
    const cdnService: MashroomCDNService | undefined = req.pluginContext.services.cdn?.service;
    const mashroomSecurityUser = await getUser(req);

    const portalApp = pluginRegistry.portalApps.find((app) => app.name === pluginName);
    if (!portalApp) {
        throw new Error(`Portal App not found: ${pluginName}`);
    }

    if (!await isAppPermitted(req, pluginName, null, portalApp)) {
        throw new Error(`User '${mashroomSecurityUser ? mashroomSecurityUser.username : 'anonymous'}' is not allowed to access Portal App: ${pluginName}`);
    }

    const appSetup = await createPortalAppSetup(portalApp, null, appConfig, mashroomSecurityUser, cdnService, pluginRegistry, req);

    const html = await renderServerSide(pluginName, appSetup, wrapEmbeddedApp, req, logger, true);

    if (!html) {
        throw new Error(`Rendering ${pluginName} server-side failed!`);
    }

    const appSSRHtml = await wrapEmbeddedApp(appSetup, appAreaId, html);

    return {
        appId: appSetup.appId,
        pluginName,
        version: appSetup.version,
        title: appSetup.title,
        appSSRHtml,
    };
};

const serverSideClientServices = (req: Request, wrapEmbeddedApp: WrapEmbeddedAppFn) => {
    return {
        messageBus: new Proxy({}, {
            get(target, prop) {
                throw new Error('Not implemented on server-side!');
            }
        }) as MashroomPortalMessageBus,
        portalAppService: new Proxy({}, {
            get(target, prop) {
                if (prop === 'serverSideRenderApp') {
                    return serverSideRenderEmbeddedApp(req, wrapEmbeddedApp);
                }
                throw new Error('Not implemented on server-side!');
            }
        }) as MashroomPortalAppService,
    };
};

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

const renderServerSideWithCache = async (pluginName: string, portalApp: MashroomPortalApp, portalAppSetup: MashroomPortalAppSetup, wrapEmbeddedApp: WrapEmbeddedAppFn, req: Request, logger: MashroomLogger): Promise<string | null> => {
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
            html = await ssrBootstrap(portalAppSetup, serverSideClientServices(req, wrapEmbeddedApp), req);
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
};

export const renderServerSide = async (pluginName: string, portalAppSetup: MashroomPortalAppSetup, wrapEmbeddedApp: WrapEmbeddedAppFn,
                                       req: Request, logger: MashroomLogger, ignoreTimeout = false): Promise<string | null> => {
    const ssrConfig = context.portalPluginConfig.ssrConfig;
    if (!ssrConfig.ssrEnable) {
        return null;
    }

    const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
    const portalApp = portalService.getPortalApps().find(({name}) => name === pluginName);
    if (!portalApp || (!portalApp.ssrBootstrap && !portalApp.ssrInitialHtmlUri)) {
        return null;
    }

    if (ignoreTimeout) {
        return renderServerSideWithCache(pluginName, portalApp, portalAppSetup, wrapEmbeddedApp, req, logger);
    }

    let timeout: any;
    return Promise.race([
        renderServerSideWithCache(pluginName, portalApp, portalAppSetup, wrapEmbeddedApp, req, logger),
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

