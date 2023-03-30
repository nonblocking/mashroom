
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
    WINDOW_VAR_PORTAL_INLINED_STYLE_APPS,
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
import {getPageEnhancementResources, allEnhancementsExistOnOriginalPage} from '../utils/page_enhancement_utils';
import {
    getFrontendResourcesBasePath,
    getFrontendApiBasePath,
    getFrontendSiteBasePath,
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
    renderContent,
} from '../utils/render_utils';
import {renderInlineStyleForServerSideRenderedApps} from '../utils/ssr_utils';
import {createPortalAppSetup, createPortalAppSetupForMissingPlugin} from '../utils/create_portal_app_setup';
import {getVersionHash, getPortalVersionHash} from '../utils/cache_utils';

import type {Request, Response, Application} from 'express';
import type { MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomCSRFService} from '@mashroom/mashroom-csrf-protection/type-definitions';
import type {MashroomMessagingService} from '@mashroom/mashroom-messaging/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';
import type {MashroomCDNService} from '@mashroom/mashroom-cdn/type-definitions';
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
    ExpressTemplateEngine,
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry, MashroomPortalPageApps} from '../../../type-definitions/internal';

const readFile = promisify(fs.readFile);
const VIEW_ENGINE_CACHE = new Map<string, ExpressTemplateEngine>();
const VIEW_CACHE = new Map<string, any>();

export default class PortalPageRenderController {

    constructor(private _portalWebapp: Application, private _pluginRegistry: MashroomPortalPluginRegistry) {
    }

    /*
     * Get the content part of a given page (without header, navigation, theme or page enhancements).
     * This only works properly if also the originalPageId (the page that was fully loaded) is given as query parameter
     */
    async getPortalPageContent(req: Request, res: Response): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.portal');
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n!.service;
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;
        const cdnService: MashroomCDNService | undefined = req.pluginContext.services.cdn?.service;
        const devMode = req.pluginContext.serverInfo.devMode;

        try {
            const {originalPageId} = req.query as { originalPageId: string | undefined };
            const {pageId} = req.params as { pageId: string };
            const sitePath = getSitePath(req);
            const user = getUser(req);

            const site = await findSiteByPath(req, sitePath);
            const originalPage = originalPageId ? await getPage(req, originalPageId) : undefined;
            const page = await getPage(req, pageId);
            const pageRef = site ? await findPageRefByPageId(req, site, pageId) : undefined;
            const originalPageRef = site && originalPageId ? await findPageRefByPageId(req, site, originalPageId) : undefined;

            logger.debug('Site:', site);
            logger.debug('PageRef:', pageRef);
            logger.debug('Page:', page);

            if (!site || !pageRef || !page) {
                logger.warn('Page ID not found:', pageId);
                res.sendStatus(404);
                return;
            }

            logger.debug(`Request for route: ${pageRef.friendlyUrl} on site: ${sitePath}`);

            if (!await isSitePermitted(req, site.siteId) || !await isPagePermitted(req, page.pageId)) {
                logger.error(`User '${user ? user.username : 'anonymous'}' is not allowed to access route: ${pageRef.friendlyUrl}`);
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
            if (originalPage && originalPageRef) {
                // If we know the current page we can decide if a full page refresh would be required
                const currentPageTheme = originalPage.theme || site.defaultTheme || context.portalPluginConfig.defaultTheme;
                if (themeName !== currentPageTheme) {
                    logger.info(`Requesting full page reload because original route ${originalPageRef.friendlyUrl} and requested route ${pageRef.friendlyUrl} have different themes`);
                    fullPageLoadRequired = true;
                } else {
                    const userAgent = determineUserAgent(req);
                    const allEnhancementsLoaded = await allEnhancementsExistOnOriginalPage(
                        this._pluginRegistry, sitePath, pageRef.friendlyUrl, originalPageRef.friendlyUrl, lang, userAgent, req);
                    if (!allEnhancementsLoaded) {
                        logger.info(`Requesting full page reload because original route ${originalPageRef.friendlyUrl} does not contain all page enhancements for route: ${pageRef.friendlyUrl}`);
                        fullPageLoadRequired = true;
                    }
                }
            }

            if (fullPageLoadRequired) {
                pageContent = '';
                evalScript = '';
            } else {
                const adminPluginName = context.portalPluginConfig.adminApp;
                const portalLayout = await this._loadLayout(layoutName, logger);
                const messages = (key: string) => i18nService.getMessage(key, lang);

                const portalPageApps = await this._getPagePortalApps(req, page, user, cdnService);
                const setupTheme = () => this._setupTheme(theme, devMode, logger);
                const result = await renderContent(portalLayout, portalPageApps, !!theme, setupTheme, messages, req, res, logger);
                pageContent = result.resultHtml;
                Object.keys(result.embeddedPortalPageApps).forEach((appAreaId) => {
                    portalPageApps[appAreaId] = portalPageApps[appAreaId] || [];
                    portalPageApps[appAreaId].push(...result.embeddedPortalPageApps[appAreaId]);
                });

                evalScript = `
                    // Update page metadata
                    var metaDescription = document.querySelector('meta[name="description"]');
                    var metaKeywords = document.querySelector('meta[name="keywords"]');
                    if (metaDescription) {
                        metaDescription.setAttribute('content', '${page.description || ''}');
                    }
                    if (metaKeywords) {
                        metaKeywords.setAttribute('content', '${page.keywords || ''}');
                    }
                    // Update pageId
                    window['${WINDOW_VAR_PORTAL_PAGE_ID}'] = '${pageId}';
                    var portalAppService = ${WINDOW_VAR_PORTAL_SERVICES}.portalAppService;
                    // Unload all running apps
                    portalAppService.loadedPortalApps.forEach(function(app) {
                      if (app.pluginName !== '${adminPluginName}') {
                        portalAppService.unloadApp(app.id);
                      }
                    });
                    // Execute scripts in the new page content (from SSR)
                    ${this._executeSSRAppContentScripts(portalPageApps)}
                    // Load/hydrate all new ones
                    ${await this._getStaticAppStartupScript(portalPageApps, undefined)}
                `;
            }

            if (cacheControlService) {
                // Since the appConfig can be dynamic (enhancement plugins), never cache
                cacheControlService.addCacheControlHeader('NEVER', req, res);
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

            const model = await this._createPortalPageModel(req, res, portalName, devMode, sitePath, site, pageRef, page, theme, layoutName, logger);

            await this._renderPage(theme, model, devMode, req, res, logger);

        } catch (e: any) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    private async _createPortalPageModel(req: Request, res: Response, portalName: string, devMode: boolean, sitePath: string,
                                         site: MashroomPortalSite, pageRef: MashroomPortalPageRef, page: MashroomPortalPage,
                                         theme: MashroomPortalTheme | undefined | null, layoutName: string | undefined | null,
                                         logger: MashroomLogger): Promise<MashroomPortalPageRenderModel> {
        const securityService: MashroomSecurityService = req.pluginContext.services.security!.service;
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n!.service;
        const csrfService: MashroomCSRFService | undefined = req.pluginContext.services.csrf?.service;
        const messagingService: MashroomMessagingService | undefined = req.pluginContext.services.messaging?.service;
        const cdnService: MashroomCDNService | undefined = req.pluginContext.services.cdn?.service;
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
        const messagingConnectPath = (webSocketSupport && messagingService && messagingService.getWebSocketConnectPath(req)) || null;
        const privateUserTopic = user && messagingService && messagingService.getUserPrivateTopic(req);
        const userAgent = determineUserAgent(req);

        const appLoadingFailedMsg = i18nService.getMessage('portalAppLoadingFailed', lang);
        const messages = (key: string) => i18nService.getMessage(key, lang);

        const portalLayout = await this._loadLayout(layoutName, logger);
        const portalPageApps = await this._getPagePortalApps(req, page, user, cdnService);

        const setupTheme = () => this._setupTheme(theme, devMode, logger);
        const appWrapperTemplateHtml = await renderAppWrapperToClientTemplate(!!theme, setupTheme, messages, req, res, logger);
        const appErrorTemplateHtml = await renderAppErrorToClientTemplate(!!theme, setupTheme, messages, req, res, logger);

        const {resultHtml: pageContent, serverSideRenderedApps, embeddedPortalPageApps} = await renderContent(portalLayout, portalPageApps, !!theme, setupTheme, messages, req, res, logger);
        Object.keys(embeddedPortalPageApps).forEach((appAreaId) => {
            portalPageApps[appAreaId] = portalPageApps[appAreaId] || [];
            portalPageApps[appAreaId].push(...embeddedPortalPageApps[appAreaId]);
        });

        const {inlineStyles} = context.portalPluginConfig.ssrConfig;
        const {headerContent: inlineStyleHeaderContent = '', includedAppStyles = []} = inlineStyles && serverSideRenderedApps.length > 0 ?
            await renderInlineStyleForServerSideRenderedApps(serverSideRenderedApps, req, logger) : {};
        const portalResourcesHeader = await this._resourcesHeader(
            req, site.siteId, sitePath, pageRef.pageId, pageRef.friendlyUrl, lang, appWrapperTemplateHtml, appErrorTemplateHtml,
            appLoadingFailedMsg, checkAuthenticationExpiration, warnBeforeAuthenticationExpiresSec, autoExtendAuthentication,
            messagingConnectPath, privateUserTopic, userAgent, cdnService?.getCDNHost(), inlineStyleHeaderContent, includedAppStyles, devMode);
        const portalResourcesFooter = await this._resourcesFooter(req, portalPageApps, adminPluginName, sitePath, pageRef.friendlyUrl, lang, userAgent);

        const siteBasePath = getFrontendSiteBasePath(req);

        let lastThemeReloadTs = Date.now();
        let themeVersionHash = '';
        let resourcesBasePath = null;
        if (theme) {
            const encodedThemeName = encodeURIComponent(theme.name);
            resourcesBasePath = `${getFrontendResourcesBasePath(req, cdnService?.getCDNHost())}${PORTAL_THEME_RESOURCES_BASE_PATH}/${encodedThemeName}`;
            lastThemeReloadTs = theme.lastReloadTs;
            themeVersionHash = getVersionHash(theme.version, theme.lastReloadTs, devMode);
        }
        const apiBasePath = `${getFrontendApiBasePath(req)}${PORTAL_APP_API_PATH}`;

        const localizedPageRef = this._localizePageRef(req, pageRef);
        const mergedPageData = {...localizedPageRef, ...page};
        const localizedSite = await this._localizeSiteAndFilterPages(req, site);

        return {
            portalName,
            siteBasePath,
            adminApp: adminPluginName,
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
                admin: securityService.isAdmin(req),
                username: user ? user.username : 'anonymous',
                displayName: user ? user.displayName || user.username : 'Anonymous',
                email: user?.email,
                pictureUrl: user?.pictureUrl,
                extraData: user?.extraData,
                roles: user ? user.roles : [],
            },
            csrfToken,
            userAgent,
            lastThemeReloadTs,
            themeVersionHash,
        };
    }

    private async _loadLayout(layoutName: string | undefined | null, logger: MashroomLogger): Promise<string> {
        const layout = this._pluginRegistry.layouts.find((l) => l.name === layoutName);
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

    private _setupTheme = (theme: MashroomPortalTheme | undefined | null, devMode: boolean, logger: MashroomLogger): void => {
        if (theme) {
            try {
                let engine;
                if (VIEW_ENGINE_CACHE.has(theme.name)) {
                    engine = VIEW_ENGINE_CACHE.get(theme.name)!;
                } else {
                    engine = theme.requireEngine();
                    VIEW_ENGINE_CACHE.set(theme.name, engine);
                }

                this._portalWebapp.engine(theme.engineName, engine);

                this._portalWebapp.set('view engine', theme.engineName);
                this._portalWebapp.set('views', theme.viewsPath);
                if (devMode) {
                    this._portalWebapp.set('view cache', false);
                } else {
                    if ('cache' in this._portalWebapp) {
                        // Switch cache per theme, otherwise we would have collisions, because the cache key is just the view name
                        let viewCache = VIEW_CACHE.get(theme.name);
                        if (!viewCache) {
                            viewCache = {};
                            VIEW_CACHE.set(theme.name, viewCache);
                        }
                        // @ts-ignore
                        this._portalWebapp.cache = viewCache;
                        this._portalWebapp.set('view cache', true);
                    } else {
                        logger.warn('Express.js view cache disabled because the implementation seems to have changed');
                    }
                }

            } catch (err) {
                logger.error(`Setting up theme failed: ${theme.name}`, err);
            }
        }
    };

    private async _renderPage(theme: MashroomPortalTheme | undefined | null, model: MashroomPortalPageRenderModel, devMode: boolean, req: Request, res: Response, logger: MashroomLogger) {
        const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;

        const setupTheme = () => this._setupTheme(theme, devMode, logger);
        const pageHtml = await renderPage(!!theme, setupTheme, model, req, res, logger);

        if (cacheControlService) {
            // Since the appConfig can be dynamic (enhancement plugins), never cache.
            // Also, the back button could expose  potential sensitive information.
            cacheControlService.addCacheControlHeader('NEVER', req, res);
        }

        res.type('text/html');
        res.send(pageHtml);
    }

    private _localizePageRef(req: Request, pageRef: MashroomPortalPageRef): MashroomPortalPageRefLocalized {
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n!.service;

        return {
            pageId: pageRef.pageId,
            title: i18nService.translate(req, pageRef.title),
            friendlyUrl: pageRef.friendlyUrl,
            clientSideRouting: pageRef.clientSideRouting,
            hidden: !!pageRef.hidden,
        };
    }

    private async _localizeSiteAndFilterPages(req: Request, site: MashroomPortalSite): Promise<MashroomPortalSiteLocalized> {
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n!.service;

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

    private async _resourcesHeader(req: Request, siteId: string, sitePath: string, pageId: string, pageFriendlyUrl: string, lang: string,
                                   appWrapperTemplateHtml: string, appErrorTemplateHtml: string, appLoadingFailedMsg: string, checkAuthenticationExpiration: boolean,
                                   warnBeforeAuthenticationExpiresSec: number, autoExtendAuthentication: boolean, messagingConnectPath: string | undefined | null,
                                   privateUserTopic: string | undefined | null, userAgent: UserAgent, cdnHost: string | undefined | null,
                                   inlineStyleHeaderContent: string, includedAppStyles: Array<string>, devMode: boolean): Promise<string> {

        return `
            <script>
                window['${WINDOW_VAR_PORTAL_API_PATH}'] = '${getFrontendApiBasePath(req)}${PORTAL_APP_API_PATH}';
                window['${WINDOW_VAR_PORTAL_SITE_URL}'] = '${getFrontendSiteBasePath(req)}';
                window['${WINDOW_VAR_PORTAL_SITE_ID}'] = '${siteId}';
                window['${WINDOW_VAR_PORTAL_PAGE_ID}'] = '${pageId}';
                window['${WINDOW_VAR_PORTAL_LANGUAGE}'] = '${lang}';
                window['${WINDOW_VAR_PORTAL_APP_WRAPPER_TEMPLATE}'] = '${this._removeBreaks(appWrapperTemplateHtml).replace(/'/g, '\\\'')}';
                window['${WINDOW_VAR_PORTAL_APP_ERROR_TEMPLATE}'] = '${this._removeBreaks(appErrorTemplateHtml).replace(/'/g, '\\\'')}';
                window['${WINDOW_VAR_PORTAL_LANGUAGE}'] = '${lang}';
                window['${WINDOW_VAR_PORTAL_APP_LOADING_FAILED_MSG}'] = '${appLoadingFailedMsg}';
                window['${WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION}'] = ${String(checkAuthenticationExpiration)};
                window['${WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRES_SEC}'] = ${String(warnBeforeAuthenticationExpiresSec)};
                window['${WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION}'] = ${String(autoExtendAuthentication)};
                window['${WINDOW_VAR_PORTAL_INLINED_STYLE_APPS}'] = [${includedAppStyles.map((a) => `'${a}'`).join(',')}];
                ${messagingConnectPath ? `window['${WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH}'] = '${messagingConnectPath}';` : ''}
                ${privateUserTopic ? `window['${WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC}'] = '${privateUserTopic}';` : ''}
                ${devMode ? `window['${WINDOW_VAR_PORTAL_DEV_MODE}'] = true;` : ''}
            </script>
            ${await this._getPageEnhancementHeaderResources(sitePath, pageFriendlyUrl, lang, userAgent, req)}
            <script src="${getFrontendResourcesBasePath(req, cdnHost)}/${PORTAL_JS_FILE}?v=${getPortalVersionHash(devMode)}"></script>
            ${inlineStyleHeaderContent}
        `;
    }

    private async _resourcesFooter(req: Request, portalPageApps: MashroomPortalPageApps, adminPluginName: string | undefined | null,
                                  sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent): Promise<string> {

        const staticAppStartupScript = await this._getStaticAppStartupScript(portalPageApps, adminPluginName);

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

    private async _getStaticAppStartupScript(portalPageApps: MashroomPortalPageApps, adminPluginName: string | undefined | null) {
        const loadStatementsWithPriority: Array<{priority: number, statement: string}> = [];
        const preloadedPortalAppSetup: Record<string, MashroomPortalAppSetup> = {};

        Object.keys(portalPageApps).forEach((areaId) => {
            portalPageApps[areaId].forEach((portalPageApp) => {
                loadStatementsWithPriority.push({
                    priority: portalPageApp.priority ?? 0,
                    statement: `portalAppService.loadApp('${areaId}', '${portalPageApp.pluginName}', '${portalPageApp.instanceId}', null, null);`,
                });
               if (portalPageApp.appSetup) {
                   preloadedPortalAppSetup[portalPageApp.instanceId] = portalPageApp.appSetup;
               }
           });
        });

        if (adminPluginName) {
            loadStatementsWithPriority.push({
                priority: -1000,
                statement: `portalAppService.loadApp('mashroom-portal-admin-app-container', '${adminPluginName}', null, null, null);`,
            });
        }

        // Load Apps with higher priority first
        const loadStatementsStr = loadStatementsWithPriority
            .sort((s1, s2) => s2.priority - s1.priority)
            .map(({statement}) => statement)
            .join('\n');

        return `
            window['${WINDOW_VAR_PORTAL_PRELOADED_APP_SETUP}'] = ${JSON.stringify(preloadedPortalAppSetup)};
            ${loadStatementsStr};
        `;
    }

    private _executeSSRAppContentScripts(portalPageApps: MashroomPortalPageApps): string {
        const appAreaIds = Object.keys(portalPageApps);
        return `
            ['${appAreaIds.join('\', \'')}'].forEach(function(appAreaId) {
                var appAreaEl = document.getElementById(appAreaId);
                if (appAreaEl) {
                    var scripts = appAreaEl.querySelectorAll('script');
                    for (var i = 0; i < scripts.length; i++) {
                        try {
                            eval(scripts[i].innerText);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            });
        `;
    }

    private async _getPagePortalApps(req: Request, page: MashroomPortalPage, mashroomSecurityUser: MashroomSecurityUser | undefined | null, cdnService: MashroomCDNService | undefined | null): Promise<MashroomPortalPageApps> {
        const portalPageApps: MashroomPortalPageApps = {};
        if (page.portalApps) {
            for (const areaId in page.portalApps) {
                if (areaId && page.portalApps.hasOwnProperty(areaId)) {
                    for (const {pluginName, instanceId} of page.portalApps[areaId]) {
                        if (!instanceId) {
                            // Data inconsistency?
                            continue;
                        }

                        const portalApp = this._getPortalApp(pluginName);

                        if (!portalApp && context.portalPluginConfig.ignoreMissingAppsOnPages) {
                            continue;
                        }
                        if (!await isAppPermitted(req, pluginName, instanceId, portalApp)) {
                            continue;
                        }

                        let appSetup;
                        if (portalApp) {
                            const instanceData = await this._getPortalAppInstance(page, portalApp, instanceId, req);
                            if (instanceData) {
                                appSetup = await createPortalAppSetup(portalApp, instanceData, null, mashroomSecurityUser, cdnService, this._pluginRegistry, req);
                            }
                        }
                        if (!appSetup) {
                            appSetup = await createPortalAppSetupForMissingPlugin(pluginName, instanceId, mashroomSecurityUser, req);
                        }

                        if (!portalPageApps[areaId]) {
                            portalPageApps[areaId] = [];
                        }
                        portalPageApps[areaId].push({
                            pluginName,
                            instanceId,
                            appSetup,
                        });
                    }
                }
            }
        }
        return portalPageApps;
    }

    private async _getPageEnhancementHeaderResources(sitePath: string, pageFriendlyUrl: string, lang: string, userAgent: UserAgent, req: Request): Promise<string> {
        const portalAppEnhancements = this._pluginRegistry.portalAppEnhancements;

        let customServices: any = {};

        portalAppEnhancements.forEach((appEnhancement) => {
            if (appEnhancement.portalCustomClientServices) {
                customServices = {
                    ...customServices,
                    ...appEnhancement.portalCustomClientServices,
                };
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
        const portalService: MashroomPortalService = req.pluginContext.services.portal!.service;
        return portalService.getPortalAppInstance(portalApp.name, instanceId);
    }
}
