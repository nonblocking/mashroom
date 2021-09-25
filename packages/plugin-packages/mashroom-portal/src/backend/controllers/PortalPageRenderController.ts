
import {promisify} from 'util';
import fs from 'fs';
import {determineUserAgent} from '@mashroom/mashroom-utils/lib/user_agent_utils';
import context from '../context/global_portal_context';
import minimalLayout from '../layouts/minimal_layout';
import {
    PORTAL_APP_API_PATH,
    PORTAL_JS_FILE,
    PORTAL_THEME_RESOURCES_BASE_PATH,
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_APP_ERROR_TEMPLATE,
    WINDOW_VAR_PORTAL_APP_LOADING_FAILED_MSG,
    WINDOW_VAR_PORTAL_APP_WRAPPER_TEMPLATE,
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
import {getPageEnhancementResources, sameEnhancementsOnBothPages} from '../utils/page_enhancement_utils';
import {
    getFrontendApiResourcesBasePath,
    getFrontendSiteBasePath,
    getPortalPath,
    getSitePath
} from '../utils/path_utils';
import {findSiteByPath, findPageRefByPageId, getPage, getPageData} from '../utils/model_utils';
import {
    forceAuthentication,
    getUser,
    isAdmin,
    isAppPermitted,
    isPagePermitted,
    isSignedIn,
    isSitePermitted
} from '../utils/security_utils';
import {
    renderPage,
    renderAppWrapperToClientTemplate,
    renderAppErrorToClientTemplate,
    renderPageContent,
} from '../utils/render_utils';
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
    MashroomPortalPage,
    MashroomPortalPageRef,
    MashroomPortalPageRefLocalized,
    MashroomPortalPageRenderModel,
    MashroomPortalService,
    MashroomPortalSite,
    MashroomPortalSiteLocalized,
    MashroomPortalTheme,
    UserAgent,
    MashroomPortalAppSetup,
    MashroomPortalPageContent,
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry, MashroomPortalPageAppsInfo} from '../../../type-definitions/internal';

const readFile = promisify(fs.readFile);
const viewEngineCache = new Map();

export default class PortalPageRenderController {

    private _startTimestamp: number;

    constructor(private _portalWebapp: Application, private _pluginRegistry: MashroomPortalPluginRegistry) {
        this._startTimestamp = Date.now();
    }

    /*
     * Get the content part of a given page (without header, navigation, theme or page enhancements).
     * This only works properly if also the currentPageId is given as query parameter
     */
    async getPortalPageContent(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

        try {
            const {currentPageId} = req.query as { currentPageId: string | undefined };
            const {pageId} = req.params as { pageId: string };
            const sitePath = getSitePath(req);
            const user = getUser(req);

            const site = await findSiteByPath(req, sitePath);
            const currentPage = currentPageId ? await getPage(req, currentPageId) : undefined;
            const page = await getPage(req, pageId);
            const pageRef = site ? await findPageRefByPageId(req, site, pageId) : undefined;
            const currentPageRef = site && currentPageId ? await findPageRefByPageId(req, site, currentPageId) : undefined;

            logger.debug('Site:', site);
            logger.debug('PageRef:', pageRef);
            logger.debug('Page:', page);

            if (!site || !pageRef || !page) {
                logger.warn('Page not found:', pageId);
                res.sendStatus(404);
                return;
            }

            logger.debug(`Request for content page: ${page} on site: ${sitePath}`);

            if (!await isSitePermitted(req, site.siteId) || !await isPagePermitted(req, page.pageId)) {
                logger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access path: ${pageRef.friendlyUrl}`);
                res.sendStatus(403);
                return;
            }

            const lang = i18nService.getLanguage(req);
            const themeName = page.theme || site.defaultTheme || context.portalPluginConfig.defaultTheme;
            const theme = this._pluginRegistry.themes.find((t) => t.name === themeName);
            const layoutName = page.layout || site.defaultLayout || context.portalPluginConfig.defaultLayout;

            let fullPageLoadRequired;
            let pageContent;
            let evalScript;
            if (currentPage && currentPageRef) {
                // If we know the current page we can decide if a full page refresh would be required
                const currentPageTheme = currentPage.theme || site.defaultTheme || context.portalPluginConfig.defaultTheme;
                const userAgent = determineUserAgent(req);
                const sameEnhancements = await sameEnhancementsOnBothPages(this._pluginRegistry, sitePath, pageRef.friendlyUrl, currentPageRef.friendlyUrl,
                    lang, userAgent, req);
                fullPageLoadRequired = themeName !== currentPageTheme || !sameEnhancements;
            }

            if (fullPageLoadRequired) {
                pageContent = '';
                evalScript = '';
            } else {
                const adminPluginName = context.portalPluginConfig.adminApp;
                const portalLayout = await this._loadLayout(layoutName, logger);
                const messages = (key: string) => i18nService.getMessage(key, lang);

                const portalAppInfo = await this._getPagePortalAppsInfo(req, page, user);
                pageContent = await this._executeWithTheme(theme, logger, () => renderPageContent(portalLayout, portalAppInfo, !!theme, messages, req, res, logger));

                evalScript = `
                    var portalAppService = ${WINDOW_VAR_PORTAL_SERVICES}.portalAppService;\n
                    // Unload all running apps\n
                    portalAppService.loadedPortalApps.forEach((app) => app.pluginName !== '${adminPluginName}' && portalAppService.unloadApp(app.id));\n
                    // Load/hydrate all new ones\n
                    ${await this._getStaticAppStartupScript(portalAppInfo, undefined)}\n
                `;
            }

            if (cacheControlService) {
                cacheControlService.addCacheControlHeader('PRIVATE_IF_AUTHENTICATED', req, res);
            }

            const content: MashroomPortalPageContent = {
                fullPageLoadRequired,
                pageContent,
                evalScript,
            };

            res.json(content);
        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    /*
     * Render the whole page
     */
    async renderPortalPage(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');

        try {
            const path = decodeURIComponent(req.path);
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
            const theme = this._pluginRegistry.themes.find((t) => t.name === themeName);
            const layoutName = page.layout || site.defaultLayout || context.portalPluginConfig.defaultLayout;

            const portalName = req.pluginContext.serverConfig.name;
            const devMode = req.pluginContext.serverInfo.devMode;

            const model = await this._createPortalPageModel(req, res, portalName, devMode, portalPath, sitePath, site, pageRef, page, theme, layoutName, logger);

            await this._renderPage(theme, model, req, res, logger);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    private async _createPortalPageModel(req: Request, res: Response, portalName: string, devMode: boolean, portalPath: string, sitePath: string,
                                         site: MashroomPortalSite, pageRef: MashroomPortalPageRef, page: MashroomPortalPage,
                                         theme: MashroomPortalTheme | undefined | null, layoutName: string | undefined | null,
                                         logger: MashroomLogger): Promise<MashroomPortalPageRenderModel> {
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
        const messages = (key: string) => i18nService.getMessage(key, lang);

        const portalLayout = await this._loadLayout(layoutName, logger);
        const appWrapperTemplateHtml = await this._executeWithTheme(theme, logger, () => renderAppWrapperToClientTemplate(!!theme, messages, req, res, logger));
        const appErrorTemplateHtml = await this._executeWithTheme(theme, logger, () => renderAppErrorToClientTemplate(!!theme, messages, req, res, logger));

        const portalAppInfo = await this._getPagePortalAppsInfo(req, page, user);
        const pageContent = await this._executeWithTheme(theme, logger, () => renderPageContent(portalLayout, portalAppInfo, !!theme, messages, req, res, logger));

        const portalResourcesHeader = await this._resourcesHeader(
            req, portalPath, site.siteId, sitePath, pageRef.pageId, pageRef.friendlyUrl, lang, appWrapperTemplateHtml, appErrorTemplateHtml,
            appLoadingFailedMsg, checkAuthenticationExpiration, warnBeforeAuthenticationExpiresSec, autoExtendAuthentication,
            messagingConnectPath, privateUserTopic, devMode, userAgent);
        const portalResourcesFooter = await this._resourcesFooter(req, portalAppInfo, adminPluginName, sitePath, pageRef.friendlyUrl, lang, userAgent);

        const siteBasePath = getFrontendSiteBasePath(req);

        let lastThemeReloadTs = Date.now();
        let resourcesBasePath = null;
        if (theme) {
            const encodedThemeName = encodeURIComponent(theme.name);
            resourcesBasePath = `${getFrontendApiResourcesBasePath(req)}${PORTAL_THEME_RESOURCES_BASE_PATH}/${encodedThemeName}`;
            lastThemeReloadTs = theme.lastReloadTs;
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
            pageContent,
            // Deprecated
            portalLayout: pageContent,
            apiBasePath,
            resourcesBasePath,
            lang,
            availableLanguages: i18nService.availableLanguages,
            messages,
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

    private _executeWithTheme = <T>(theme: MashroomPortalTheme | undefined | null, logger: MashroomLogger, fn: () => Promise<T>): Promise<T> => {
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

                return fn();
            } catch (err) {
                logger.error(`Setting up theme failed: ${theme.name}`, err);
            }
        }

        return fn();
    }

    private async _renderPage(theme: MashroomPortalTheme | undefined | null, model: MashroomPortalPageRenderModel, req: Request, res: Response, logger: MashroomLogger) {
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

        const pageHtml = await this._executeWithTheme(theme, logger, () => renderPage(!!theme, model, req, res, logger));

        if (cacheControlService) {
            // Disable the browser cache for authenticated users to prevent that back button exposes potential sensitive information.
            // If a CSRF token is present disable the caching always because it must not be cached.
            cacheControlService.addCacheControlHeader(model.csrfToken ? 'NEVER' : 'ONLY_FOR_ANONYMOUS_USERS', req, res);
        }

        res.type('text/html');
        res.send(pageHtml);
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
                                   appWrapperTemplateHtml: string, appErrorTemplateHtml: string,
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
                window['${WINDOW_VAR_PORTAL_APP_WRAPPER_TEMPLATE}'] = '${this._removeBreaks(appWrapperTemplateHtml).replace(/'/g, '\\\'')}';
                window['${WINDOW_VAR_PORTAL_APP_ERROR_TEMPLATE}'] = '${this._removeBreaks(appErrorTemplateHtml).replace(/'/g, '\\\'')}';
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

    private async _resourcesFooter(req: Request, portalAppInfo: MashroomPortalPageAppsInfo, adminPluginName: string | undefined | null,
                                  sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent): Promise<string> {

        const staticAppStartupScript = await this._getStaticAppStartupScript(portalAppInfo, adminPluginName);

        return `
            <script>
                var portalAppService = ${WINDOW_VAR_PORTAL_SERVICES}.portalAppService;
                ${staticAppStartupScript}
            </script>
            ${await this._getPageEnhancementFooterResources(sitePath, pageFriendlyUrl, lang, userAgent, req)}
        `;
    }

    private _removeBreaks(html: string) {
        return html.replace(/(\r\n|\r|\n)/g, '');
    }

    private async _getStaticAppStartupScript(portalAppInfo: MashroomPortalPageAppsInfo, adminPluginName: string | undefined | null) {
        const loadStatements = [];
        const preloadedPortalAppSetup: Record<string, MashroomPortalAppSetup> = {};

        Object.keys(portalAppInfo).forEach((areaId) => {
           portalAppInfo[areaId].forEach((appInfo) => {
               loadStatements.push(
                   `portalAppService.loadApp('${areaId}', '${appInfo.pluginName}', '${appInfo.instanceId}', null, null);`
               );
               preloadedPortalAppSetup[appInfo.instanceId] = appInfo.appSetup;
           });
        });

        if (adminPluginName) {
            loadStatements.push(
                `portalAppService.loadApp('mashroom-portal-admin-app-container', '${adminPluginName}', null, null, null);`
            );
        }

        return `
            window['${WINDOW_VAR_PORTAL_PRELOADED_APP_SETUP}'] = ${JSON.stringify(preloadedPortalAppSetup)};
            ${loadStatements.join('\n')};
        `;
    }

    private async _getPagePortalAppsInfo(req: Request, page: MashroomPortalPage, mashroomSecurityUser: MashroomSecurityUser | undefined | null): Promise<MashroomPortalPageAppsInfo> {
        const info: MashroomPortalPageAppsInfo = {};
        if (page.portalApps) {
            for (const areaId in page.portalApps) {
                if (areaId && page.portalApps.hasOwnProperty(areaId)) {
                    for (const {pluginName, instanceId} of page.portalApps[areaId]) {
                        const portalApp = this._getPortalApp(pluginName);
                        if (!instanceId || !portalApp || !await isAppPermitted(req, pluginName, instanceId, portalApp)) {
                            continue;
                        }

                        let instanceData = await this._getPortalAppInstance(page, portalApp, instanceId, req);
                        if (!instanceData) {
                            // Data inconsistency?
                            instanceData = {
                                pluginName,
                                instanceId,
                                appConfig: {}
                            }
                        }

                        const appSetup = await createPortalAppSetup(portalApp, instanceData, mashroomSecurityUser, this._pluginRegistry, req);

                        if (!info[areaId]) {
                            info[areaId] = [];
                        }
                        info[areaId].push({
                            pluginName,
                            instanceId,
                            appSetup,
                        });
                    }
                }
            }
        }
        return info;
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

        enhancement += await getPageEnhancementResources(this._pluginRegistry, 'header', sitePath, pageFriendlyUrl, lang, userAgent, req);

        return enhancement;
    }

    private async _getPageEnhancementFooterResources(sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, req: Request): Promise<string> {
        return getPageEnhancementResources(this._pluginRegistry, 'footer', sitePath, pageFriendlyUrl, lang, userAgent, req);
    }

    private _getPortalApp(pluginName: string) {
        return this._pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }

    private async _getPortalAppInstance(page: MashroomPortalPage, portalApp: MashroomPortalApp, instanceId: string, req: Request) {
        const portalService: MashroomPortalService = req.pluginContext.services.portal.service;
        return portalService.getPortalAppInstance(portalApp.name, instanceId);
    }
}
