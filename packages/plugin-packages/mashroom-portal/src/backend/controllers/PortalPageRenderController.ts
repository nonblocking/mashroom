
import {promisify} from 'util';
import fs from 'fs';
import {determineUserAgent} from '@mashroom/mashroom-utils/lib/user_agent_utils';
import context from '../context/global_portal_context';
import minimalLayout from '../layouts/minimal_layout';
import minimalTemplatePortal from '../theme/minimal_template_portal';
import {
    PORTAL_APP_API_PATH,
    PORTAL_JS_FILE,
    PORTAL_PAGE_ENHANCEMENT_RESOURCES_BASE_PATH,
    PORTAL_THEME_RESOURCES_BASE_PATH,
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_APP_LOADING_FAILED_MSG,
    WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION,
    WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION,
    WINDOW_VAR_PORTAL_CUSTOM_CLIENT_SERVICES,
    WINDOW_VAR_PORTAL_DEV_MODE,
    WINDOW_VAR_PORTAL_LANGUAGE,
    WINDOW_VAR_PORTAL_PAGE_ID,
    WINDOW_VAR_PORTAL_PRELOADED_APP_SETUP,
    WINDOW_VAR_PORTAL_SERVICES,
    WINDOW_VAR_PORTAL_SITE_ID,
    WINDOW_VAR_PORTAL_SITE_URL,
    WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRES_SEC,
    WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH,
    WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC,
} from '../constants';
import SitePagesTraverser from '../utils/SitePagesTraverser';
import {getResourceAsString} from '../utils/resource_utils';
import {
    getFrontendApiResourcesBasePath,
    getFrontendSiteBasePath,
    getPortalPath,
    getSitePath
} from '../utils/path_utils';
import {getPageData} from '../utils/model_utils';
import {
    forceAuthentication,
    getUser,
    isAdmin,
    isAppPermitted,
    isPagePermitted,
    isSignedIn,
    isSitePermitted
} from '../utils/security_utils';
import createPortalAppSetup from '../utils/create_portal_app_setup';

import type {Request, Response, Application} from 'express';
import type { MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomCSRFService} from '@mashroom/mashroom-csrf-protection/type-definitions';
import type {MashroomMessagingService} from '@mashroom/mashroom-messaging/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';
import type {
    MashroomPortalApp,
    MashroomPortalPage, MashroomPortalPageEnhancement,
    MashroomPortalPageEnhancementResource,
    MashroomPortalPageRef,
    MashroomPortalPageRefLocalized,
    MashroomPortalPageRenderModel, MashroomPortalService,
    MashroomPortalSite,
    MashroomPortalSiteLocalized, UserAgent,
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry,} from '../../../type-definitions/internal';
import {MashroomPortalAppSetup} from '../../../type-definitions';

const readFile = promisify(fs.readFile);
const viewEngineCache = new Map();

export default class PortalPageRenderController {

    private _startTimestamp: number;

    constructor(private _portalWebapp: Application, private _pluginRegistry: MashroomPortalPluginRegistry) {
        this._startTimestamp = Date.now();
    }

    async renderPortalPage(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const path = req.path;
            const sitePath = getSitePath(req);
            const portalPath = getPortalPath();

            logger.debug(`Request for portal page: ${path} on site: ${sitePath}`);

            const {site, pageRef, page} = await getPageData(sitePath, path, req, logger);
            logger.debug('Site:', site);
            logger.debug('PageRef:', pageRef);
            logger.debug('Page:', page);

            if (!site || !pageRef || !page) {
                logger.warn('Page not found:', path);
                res.sendStatus(404);
                return;
            }

            if (!await isSitePermitted(req, site.siteId) || !await isPagePermitted(req, page.pageId)) {
                if (isSignedIn(req)) {
                    const user = getUser(req);
                    logger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access path: ${path}`);
                    res.sendStatus(403);
                } else {
                    await forceAuthentication(path, req, res, logger);
                }
                return;
            }

            const themeName = page.theme || site.defaultTheme || context.portalPluginConfig.defaultTheme;
            const layoutName = page.layout || site.defaultLayout || context.portalPluginConfig.defaultLayout;

            const portalName = req.pluginContext.serverConfig.name;
            const devMode = req.pluginContext.serverInfo.devMode;
            const model = await this._createPortalPageModel(req, portalName, devMode, portalPath, sitePath, site, pageRef, page, themeName, layoutName, logger);

            await this._render(themeName, model, req, res, logger);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    private async _createPortalPageModel(req: Request, portalName: string, devMode: boolean, portalPath: string, sitePath: string,
                                 site: MashroomPortalSite, pageRef: MashroomPortalPageRef, page: MashroomPortalPage,
                                 themeName: string | undefined | null, layoutName: string | undefined | null, logger: MashroomLogger): Promise<MashroomPortalPageRenderModel> {
        const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;
        const csrfService: MashroomCSRFService = req.pluginContext.services.csrf?.service;
        const messagingService: MashroomMessagingService = req.pluginContext.services.messaging?.service;
        const webSocketSupport = !!req.pluginContext.services.websocket;

        const user: MashroomSecurityUser | undefined | null = securityService.getUser(req);
        const lang = i18nService.getLanguage(req);
        const csrfToken = csrfService && csrfService.getCSRFToken(req);

        let adminPluginName = null;
        const admin = isAdmin(req);
        if (admin) {
            adminPluginName = context.portalPluginConfig.adminApp;
        }

        let checkAuthenticationExpiration = false;
        if (user) {
            checkAuthenticationExpiration = true;
        }
        const warnBeforeAuthenticationExpiresSec = context.portalPluginConfig.warnBeforeAuthenticationExpiresSec;
        const autoExtendAuthentication = context.portalPluginConfig.autoExtendAuthentication;
        const messagingConnectPath = webSocketSupport && messagingService && messagingService.getWebSocketConnectPath(req);
        const privateUserTopic = user && messagingService && messagingService.getUserPrivateTopic(req);
        const userAgent = determineUserAgent(req);

        const appLoadingFailedMsg = i18nService.getMessage('portalAppLoadingFailed', lang);
        const portalLayout = await this._loadLayout(layoutName, logger);
        const portalResourcesHeader = await this._resourcesHeader(req, portalPath, site.siteId, sitePath, pageRef.pageId, pageRef.friendlyUrl, lang,
            appLoadingFailedMsg, checkAuthenticationExpiration, warnBeforeAuthenticationExpiresSec, autoExtendAuthentication,
            messagingConnectPath, privateUserTopic, devMode, userAgent);
        const portalResourcesFooter = await this._resourcesFooter(req, page, adminPluginName, sitePath, pageRef.friendlyUrl, lang, userAgent, user);
        const siteBasePath = getFrontendSiteBasePath(req);

        let lastThemeReloadTs = Date.now();
        let resourcesBasePath = null;
        if (themeName) {
            const encodedThemeName = encodeURIComponent(themeName);
            resourcesBasePath = `${getFrontendApiResourcesBasePath(req)}${PORTAL_THEME_RESOURCES_BASE_PATH}/${encodedThemeName}`;
            const theme = this._pluginRegistry.themes.find((t) => t.name === themeName);
            if (theme) {
                lastThemeReloadTs = theme.lastReloadTs;
            }
        }
        const apiBasePath = `${getFrontendApiResourcesBasePath(req)}${PORTAL_APP_API_PATH}`;

        const localizedPageRef = this._localizePageRef(req, pageRef);
        const mergedPageData = {...localizedPageRef, ...page};
        const localizedSite = await this._localizeSiteAndFilterPages(req, site);

        return {
            portalName,
            portalBasePath: portalPath,
            siteBasePath,
            site: localizedSite,
            page: mergedPageData,
            portalResourcesHeader,
            portalResourcesFooter,
            portalLayout,
            apiBasePath,
            resourcesBasePath,
            lang,
            availableLanguages: i18nService.availableLanguages,
            messages: (key) => i18nService.getMessage(key, lang),
            user: {
                guest: !user,
                username: user ? user.username : 'anonymous',
                displayName: user ? user.displayName || user.username : 'Anonymous',
                roles: user ? user.roles : [],
            },
            csrfToken,
            userAgent,
            lastThemeReloadTs,
        };
    }

    private async _loadLayout(layoutName: string | undefined | null, logger: MashroomLogger): Promise<string> {
        const pluginRegistry = this._pluginRegistry;
        const layout = pluginRegistry.layouts.find((l) => l.name === layoutName);
        if (layout) {
            try {
                const fileData = await readFile(layout.layoutPath);
                return fileData.toString('utf-8');
            } catch (err) {
                logger.error(`Loading layout file failed: ${layout.layoutPath}`, err);
            }
        }

        logger.warn(`Layout not found or invalid: ${layoutName || '<undefined>'}. Using minimal fallback layout.`);
        return minimalLayout;
    }

    private async _render(themeName: string | undefined | null, model: MashroomPortalPageRenderModel, req: Request, res: Response, logger: MashroomLogger) {
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;
        const theme = this._pluginRegistry.themes.find((t) => t.name === themeName);
        if (theme) {
            try {
                let engine;
                if (viewEngineCache.has(theme.name)) {
                    engine = viewEngineCache.get(theme.name);
                } else {
                    engine = theme.requireEngine();
                    viewEngineCache.set(theme.name, engine);
                }
                this._portalWebapp.engine(theme.engineName, engine);
                this._portalWebapp.set('view engine', theme.engineName);
                this._portalWebapp.set('views', theme.viewsPath);

                if (cacheControlService) {
                    // Disable the browser cache for authenticated users to prevent that back button exposes potential sensitive information.
                    // If a CSRF token is present disable the caching always because it must not be cached.
                    cacheControlService.addCacheControlHeader(model.csrfToken ? 'NEVER' : 'ONLY_FOR_ANONYMOUS_USERS' , req, res);
                }

                res.render('portal', model);
                return;
            } catch (err) {
                logger.error(`Setting up theme failed: ${themeName ? themeName : '<undefined>'}`, err);
            }
        }

        logger.warn(`Theme not found or invalid: ${themeName ? themeName : '<undefined>'}. Using minimal fallback theme.`);
        res.type('text/html');
        res.send(minimalTemplatePortal(model));
    }

    private _localizePageRef(req: Request, pageRef: MashroomPortalPageRef): MashroomPortalPageRefLocalized {
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

        return {
            pageId: pageRef.pageId,
            title: i18nService.translate(req, pageRef.title),
            friendlyUrl: pageRef.friendlyUrl,
            hidden: !!pageRef.hidden,
        };
    }

    private async _localizeSiteAndFilterPages(req: Request, site: MashroomPortalSite): Promise<MashroomPortalSiteLocalized> {
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

        const siteTraverser = new SitePagesTraverser(site.pages);
        const pages = await siteTraverser.filterAndTranslate(req) || [];

        const localizedSite: MashroomPortalSiteLocalized = {
            siteId: site.siteId,
            title: i18nService.translate(req, site.title),
            path: site.path,
            pages,
        };

        return localizedSite;
    }

    private async _resourcesHeader(req: Request, portalPrefix: string, siteId: string, sitePath: string, pageId: string, pageFriendlyUrl: string, lang: string,
                     appLoadingFailedMsg: string, checkAuthenticationExpiration: boolean, warnBeforeAuthenticationExpiresSec: number,
                     autoExtendAuthentication: boolean, messagingConnectPath: string | undefined | null, privateUserTopic: string | undefined | null,
                    devMode: boolean, userAgent: UserAgent): Promise<string> {
        return `
            <script>
                window['${WINDOW_VAR_PORTAL_API_PATH}'] = '${getFrontendApiResourcesBasePath(req)}${PORTAL_APP_API_PATH}';
                window['${WINDOW_VAR_PORTAL_SITE_URL}'] = '${portalPrefix}${sitePath}';
                window['${WINDOW_VAR_PORTAL_SITE_ID}'] = '${siteId}';
                window['${WINDOW_VAR_PORTAL_PAGE_ID}'] = '${pageId}';
                window['${WINDOW_VAR_PORTAL_LANGUAGE}'] = '${lang}';
                window['${WINDOW_VAR_PORTAL_APP_LOADING_FAILED_MSG}'] = '${appLoadingFailedMsg}';
                window['${WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION}'] = ${String(checkAuthenticationExpiration)};
                window['${WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRES_SEC}'] = ${String(warnBeforeAuthenticationExpiresSec)};
                window['${WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION}'] = ${String(autoExtendAuthentication)}
                ${messagingConnectPath ? `window['${WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH}'] = '${messagingConnectPath}';` : ''}
                ${privateUserTopic ? `window['${WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC}'] = '${privateUserTopic}';` : ''}
                ${devMode ? `window['${WINDOW_VAR_PORTAL_DEV_MODE}'] = true;` : ''}
            </script>
            ${await this._getPageEnhancementHeaderResources(sitePath, pageFriendlyUrl, lang, userAgent, req)}
            <script src="${getFrontendApiResourcesBasePath(req)}/${PORTAL_JS_FILE}?v=${this._startTimestamp}"></script>
        `;
    }

    private async _resourcesFooter(req: Request, page: MashroomPortalPage, adminPluginName: string | undefined | null,
                                  sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent,
                                  mashroomSecurityUser: MashroomSecurityUser | undefined | null): Promise<string> {

        const staticAppStartupScript = await this._getStaticAppStartupScript(req, page, mashroomSecurityUser, adminPluginName);

        return `
            <script>
                var portalAppService = ${WINDOW_VAR_PORTAL_SERVICES}.portalAppService;
                ${staticAppStartupScript}
            </script>
            ${await this._getPageEnhancementFooterResources(sitePath, pageFriendlyUrl, lang, userAgent, req)}
        `;
    }

    private async _getStaticAppStartupScript(req: Request, page: MashroomPortalPage, mashroomSecurityUser: MashroomSecurityUser | undefined | null,
                                            adminPluginName: string | undefined | null) {
        const loadStatements = [];
        const preloadedPortalAppSetup: Record<string, MashroomPortalAppSetup> = {};

        if (adminPluginName) {
            loadStatements.push(
                `portalAppService.loadApp('mashroom-portal-admin-app-container', '${adminPluginName}', null, null, null);`
            );
        }

        if (page.portalApps) {
            for (const areaId in page.portalApps) {
                if (areaId && page.portalApps.hasOwnProperty(areaId)) {
                    for (const portalAppInstance of page.portalApps[areaId]) {
                        const portalApp = this._getPortalApp(portalAppInstance.pluginName);
                        if (!await isAppPermitted(req, portalAppInstance.pluginName, portalAppInstance.instanceId, portalApp)) {
                            continue;
                        }

                        const instanceId = portalAppInstance.instanceId;
                        if (instanceId) {
                            loadStatements.push(
                                `portalAppService.loadApp('${areaId}', '${portalAppInstance.pluginName}', '${instanceId}', null, null);`
                            );
                            if (portalApp) {
                                const instanceData = await this._getPortalAppInstance(page, portalApp, instanceId, req);
                                if (instanceData) {
                                    preloadedPortalAppSetup[instanceId] = await createPortalAppSetup(portalApp, instanceData, mashroomSecurityUser, this._pluginRegistry, req);
                                }
                            }
                        }
                    }
                }
            }
        }

        return `
            window['${WINDOW_VAR_PORTAL_PRELOADED_APP_SETUP}'] = ${JSON.stringify(preloadedPortalAppSetup)};
            ${loadStatements.join('\n')};
        `;
    }

    private async _getPageEnhancementHeaderResources(sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, req: Request): Promise<string> {
        const portalAppEnhancements = this._pluginRegistry.portalAppEnhancements;

        let customServices: any = {};

        portalAppEnhancements.forEach((appEnhancement) => {
            if (appEnhancement.portalCustomClientServices) {
                customServices = {
                    ...customServices,
                    ...appEnhancement.portalCustomClientServices,
                }
            }
        });

        let enhancement = '';

        if (Object.keys(customServices).length > 0) {
            enhancement += `
                <script>
                    window['${WINDOW_VAR_PORTAL_CUSTOM_CLIENT_SERVICES}'] = ${JSON.stringify(customServices)};
                </script>
            `;
        }

        enhancement += await this._getPageEnhancementResources('header', sitePath, pageFriendlyUrl, lang, userAgent, req);

        return enhancement;
    }

    private async _getPageEnhancementFooterResources(sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, req: Request): Promise<string> {
        return this._getPageEnhancementResources('footer', sitePath, pageFriendlyUrl, lang, userAgent, req);
    }

    private async _getPageEnhancementResources(location: 'header' | 'footer', sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, req: Request): Promise<string> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.portal');
        let enhancement = '';

        const portalPageEnhancements = [...this._pluginRegistry.portalPageEnhancements];
        // Sort according to "order" property
        portalPageEnhancements.sort((enhancement1, enhancement2) => enhancement1.order < enhancement2.order ? -1 : 1);

        for (let i = 0; i < portalPageEnhancements.length; i++) {
            const pageEnhancement = portalPageEnhancements[i];
            if (pageEnhancement.pageResources && Array.isArray(pageEnhancement.pageResources.js)) {
                for (let j = 0; j < pageEnhancement.pageResources.js.length; j++) {
                    const jsResource = pageEnhancement.pageResources.js[j];
                    if (this._pageEnhancementResourceShallInclude(location, pageEnhancement, jsResource, sitePath, pageFriendlyUrl, lang, userAgent, req)) {
                        logger.debug(`Adding JS page resource to the ${location}:`, jsResource);
                        enhancement += await this._getPageEnhancementResource('js', pageEnhancement, jsResource, sitePath, pageFriendlyUrl, lang, userAgent, req, logger);
                    }
                }
            }
            if (pageEnhancement.pageResources && Array.isArray(pageEnhancement.pageResources.css)) {
                for (let j = 0; j < pageEnhancement.pageResources.css.length; j++) {
                    const cssResource = pageEnhancement.pageResources.css[j];
                    if (this._pageEnhancementResourceShallInclude(location, pageEnhancement, cssResource, sitePath, pageFriendlyUrl, lang, userAgent, req)) {
                        logger.debug(`Adding CSS page resource to the ${location}:`, cssResource);
                        enhancement += await this._getPageEnhancementResource('css', pageEnhancement, cssResource, sitePath, pageFriendlyUrl, lang, userAgent, req, logger);
                    }
                }
            }
        }

        return enhancement;
    }

    private async _getPageEnhancementResource(type: 'js' | 'css', enhancement: MashroomPortalPageEnhancement, resource: MashroomPortalPageEnhancementResource, sitePath: string,
                                      pageFriendlyUrl: string, lang: string, userAgent: UserAgent, req: Request, logger: MashroomLogger): Promise<string> {
        const { path: resourcePath, dynamicResource } = resource;
        if (!resource.inline && resourcePath) {
            if (type === 'js') {
                return `
                    <script src="${getFrontendApiResourcesBasePath(req)}${PORTAL_PAGE_ENHANCEMENT_RESOURCES_BASE_PATH}/${encodeURIComponent(enhancement.name)}/${resourcePath}?v=${enhancement.lastReloadTs}"></script>
                `;
            } else {
                return `
                    <link rel="stylesheet" href="${getFrontendApiResourcesBasePath(req)}${PORTAL_PAGE_ENHANCEMENT_RESOURCES_BASE_PATH}/${encodeURIComponent(enhancement.name)}/${resourcePath}?v=${enhancement.lastReloadTs}" />
                `;
            }
        } else {
            let resourceAsString;
            if (resourcePath) {
                const resourceUri = `${enhancement.resourcesRootUri}/${resourcePath}`;
                try {
                    resourceAsString = await getResourceAsString(resourceUri);
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
    }

    private _pageEnhancementResourceShallInclude(location: 'header' | 'footer', enhancement: MashroomPortalPageEnhancement, resource: MashroomPortalPageEnhancementResource,
                       sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, req: Request): boolean {
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
    }

    private _getPortalApp(pluginName: string) {
        return this._pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }

    private async _getPortalAppInstance(page: MashroomPortalPage, portalApp: MashroomPortalApp, instanceId: string, req: Request) {
        const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
        return portalService.getPortalAppInstance(portalApp.name, instanceId);
    }
}
