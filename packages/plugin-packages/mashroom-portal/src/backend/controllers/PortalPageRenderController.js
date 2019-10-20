// @flow

import {promisify} from 'util';
import fs from 'fs';
import {determineUserAgent} from '@mashroom/mashroom-utils/lib/user_agent_utils';
import context from '../context/global_portal_context';
import minimalLayout from '../layouts/minimal_layout';
import minimalTemplatePortal from '../theme/minimal_template_portal';
import {
    PORTAL_JS_FILE,
    PORTAL_PRIVATE_PATH,
    PORTAL_APP_API_PATH,
    PORTAL_THEME_RESOURCES_BASE_PATH,
    WINDOW_VAR_PORTAL_SERVICES,
    WINDOW_VAR_PORTAL_SITE_URL,
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_PAGE_ID,
    WINDOW_VAR_PORTAL_SITE_ID,
    WINDOW_VAR_PORTAL_LANGUAGE,
    WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION,
    WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRES_SEC,
    WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION,
    WINDOW_VAR_PORTAL_APP_LOADING_FAILED_MSG,
    WINDOW_VAR_PORTAL_DEV_MODE,
    WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH,
    WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC,
} from '../constants';
import SitePagesTraverser from '../utils/SitePagesTraverser';
import {getPortalPath, getSiteAndFriendlyUrl} from '../utils/path_utils';
import {getPageData, getDefaultSite} from '../utils/model_utils';
import {isAppPermitted, isPagePermitted, isSitePermitted, isSignedIn, isAdmin, authenticate} from '../utils/security_utils';

const readFile = promisify(fs.readFile);
const viewEngineCache = new Map();

import type {
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
    MashroomServerConfig,
    ExpressApplication,
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomSecurityService,
    MashroomSecurityUser
} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomCSRFService} from '@mashroom/mashroom-csrf-protection/type-definitions';
import type {MashroomMessagingService} from '@mashroom/mashroom-messaging/type-definitions';
import type {
    MashroomPortalSite,
    MashroomPortalPage,
    MashroomPortalPageRenderModel,
    MashroomPortalPageRef,
    MashroomPortalPluginRegistry,
    MashroomPortalPageRefLocalized,
    MashroomPortalSiteLocalized,
} from '../../../type-definitions';

export default class PortalPageRenderController {

    portalWebapp: ExpressApplication;
    pluginRegistry: MashroomPortalPluginRegistry;
    startTimestamp: number;

    constructor(portalWebapp: ExpressApplication, pluginRegistry: MashroomPortalPluginRegistry, startTimestamp: number) {
        this.portalWebapp = portalWebapp;
        this.pluginRegistry = pluginRegistry;
        this.startTimestamp = startTimestamp;
    }

    async renderPortalPage(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const serverConfig = req.pluginContext.serverConfig;

            const path = req.path;
            const portalPath = getPortalPath();

            logger.info('Sending portal page:', path);
            const {sitePath, friendlyUrl} = getSiteAndFriendlyUrl(req);

            if (!sitePath) {
                const defaultSite = await getDefaultSite(req, logger);
                if (defaultSite) {
                    logger.debug(`Redirecting to default site: ${defaultSite.siteId}`);
                    res.redirect(portalPath + defaultSite.path);
                } else {
                    res.sendStatus(404);
                }
                return;
            }

            logger.debug(`Determined: Site path: ${sitePath}, Friendly URL: ${friendlyUrl || '/'}`);

            const {site, pageRef, page} = await getPageData(sitePath, friendlyUrl, req, logger);
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
                    res.sendStatus(403);
                } else {
                    await authenticate(req, res);
                }
                return;
            }

            const themeName = page.theme || site.defaultTheme || context.portalPluginConfig.defaultTheme;
            const layoutName = page.layout || site.defaultLayout;

            const model = await this._createPortalPageModel(req, serverConfig, portalPath, sitePath, site, pageRef, page, themeName, layoutName, logger);

            this._render(themeName, model, res, logger);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async _createPortalPageModel(req: ExpressRequest, serverConfig: MashroomServerConfig, portalPath: string, sitePath: string, site: MashroomPortalSite, pageRef: MashroomPortalPageRef,
                                    page: MashroomPortalPage, themeName: ?string, layoutName: ?string, logger: MashroomLogger): Promise<MashroomPortalPageRenderModel> {
        const securityService: MashroomSecurityService = req.pluginContext.services.security.service;
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;
        const csrfService: MashroomCSRFService = req.pluginContext.services.csrf && req.pluginContext.services.csrf.service;
        const messagingService: MashroomMessagingService = req.pluginContext.services.messaging && req.pluginContext.services.messaging.service;
        const webSocketSupport = !!req.pluginContext.services.websocket;

        const user: ?MashroomSecurityUser = securityService.getUser(req);
        const lang = i18nService.getLanguage(req);
        const csrfToken = csrfService && csrfService.getCSRFToken(req);

        let adminPluginName = null;
        const admin = isAdmin(req);
        if (admin) {
            adminPluginName = context.portalPluginConfig.adminApp;
        }

        const devMode = serverConfig.pluginPackageFolders && serverConfig.pluginPackageFolders.some((ppf) => ppf.devMode);
        let checkAuthenticationExpiration = false;
        if (user) {
            checkAuthenticationExpiration = true;
        }
        const warnBeforeAuthenticationExpiresSec = context.portalPluginConfig.warnBeforeAuthenticationExpiresSec;
        const autoExtendAuthentication = context.portalPluginConfig.autoExtendAuthentication;
        const messagingConnectPath = webSocketSupport && messagingService && messagingService.getWebSocketConnectPath(req);
        const privateUserTopic = messagingService && messagingService.getUserPrivateTopic(req);

        const appLoadingFailedMsg = i18nService.getMessage('portalAppLoadingFailed', lang);
        const portalLayout = await this._loadLayout(layoutName, logger);
        const portalResourcesHeader = this._resourcesHeader(req, portalPath, site.siteId, sitePath, pageRef.pageId, lang,
            appLoadingFailedMsg, checkAuthenticationExpiration, warnBeforeAuthenticationExpiresSec, autoExtendAuthentication,
            messagingConnectPath, privateUserTopic, devMode);
        const portalResourcesFooter = await this._resourcesFooter(req, page, adminPluginName);
        const siteBasePath = `${portalPath}${sitePath}`;
        let resourcesBasePath = null;
        if (themeName) {
            const encodedThemeName = encodeURIComponent(themeName);
            resourcesBasePath = `${portalPath}${PORTAL_PRIVATE_PATH}${PORTAL_THEME_RESOURCES_BASE_PATH}/${encodedThemeName}`;
        }

        const localizedPageRef = this._localizePageRef(req, pageRef);
        const mergedPageData = Object.assign({}, localizedPageRef, page);
        const localizedSite = await this._localizeSiteAndFilterPages(req, site);
        const userAgent = determineUserAgent(req);

        return {
            portalName: serverConfig.name,
            portalBasePath: portalPath,
            siteBasePath,
            site: localizedSite,
            page: mergedPageData,
            portalResourcesHeader,
            portalResourcesFooter,
            portalLayout,
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
            userAgent
        };
    }

    async _loadLayout(layoutName: ?string, logger: MashroomLogger): Promise<string> {
        const pluginRegistry = this.pluginRegistry;
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

    _render(themeName: ?string, model: MashroomPortalPageRenderModel, res: ExpressResponse, logger: MashroomLogger) {
        const pluginRegistry = this.pluginRegistry;
        const theme = pluginRegistry.themes.find((t) => t.name === themeName);
        if (theme) {
            try {
                let engine = null;
                if (viewEngineCache.has(theme.name)) {
                    engine = viewEngineCache.get(theme.name);
                } else {
                    engine = theme.requireEngine();
                    viewEngineCache.set(theme.name, engine);
                }
                this.portalWebapp.engine(theme.engineName, engine);
                this.portalWebapp.set('view engine', theme.engineName);
                this.portalWebapp.set('views', theme.viewsPath);

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

    _localizePageRef(req: ExpressRequest, pageRef: MashroomPortalPageRef): MashroomPortalPageRefLocalized {
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

        return {
            pageId: pageRef.pageId,
            title: i18nService.translate(req, pageRef.title),
            friendlyUrl: pageRef.friendlyUrl,
            hidden: !!pageRef.hidden,
        };
    }

    async _localizeSiteAndFilterPages(req: ExpressRequest, site: MashroomPortalSite): Promise<MashroomPortalSiteLocalized> {
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n.service;

        const localizedSite = {
            siteId: site.siteId,
            title: i18nService.translate(req, site.title),
            path: site.path,
            pages: []
        };

        const siteTraverser = new SitePagesTraverser(site.pages);
        localizedSite.pages = await siteTraverser.filterAndTranslate(req) || [];

        return localizedSite;
    }

    _resourcesHeader(req: ExpressRequest, portalPrefix: string, siteId: string, sitePath: string, pageId: string, lang: string,
                     appLoadingFailedMsg: string, checkAuthenticationExpiration: boolean, warnBeforeAuthenticationExpiresSec: number,
                     autoExtendAuthentication: boolean, messagingConnectPath: ?string, privateUserTopic: ?string, devMode: boolean) {
        return `
            <script>
                window['${WINDOW_VAR_PORTAL_API_PATH}'] = '${portalPrefix}${PORTAL_PRIVATE_PATH}${PORTAL_APP_API_PATH}';
                window['${WINDOW_VAR_PORTAL_SITE_URL}'] = '${portalPrefix}${sitePath}';
                window['${WINDOW_VAR_PORTAL_SITE_ID}'] = '${siteId}';
                window['${WINDOW_VAR_PORTAL_PAGE_ID}'] = '${pageId}';
                window['${WINDOW_VAR_PORTAL_LANGUAGE}'] = '${lang}';
                window['${WINDOW_VAR_PORTAL_APP_LOADING_FAILED_MSG}'] = '${appLoadingFailedMsg}';
                window['${WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION}'] = ${String(checkAuthenticationExpiration)};
                window['${WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRES_SEC}'] = ${String(warnBeforeAuthenticationExpiresSec)};
                window['${WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION}'] = ${String(autoExtendAuthentication)};
                ${messagingConnectPath ? `window['${WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH}'] = '${messagingConnectPath}';` : ''};
                ${privateUserTopic ? `window['${WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC}'] = '${privateUserTopic}';` : ''};
                ${devMode ? `window['${WINDOW_VAR_PORTAL_DEV_MODE}'] = true` : ''}
            </script>
            <script src="${portalPrefix}${PORTAL_PRIVATE_PATH}/${PORTAL_JS_FILE}?v=${this.startTimestamp}"></script>
        `;
    }

    async _resourcesFooter(req: ExpressRequest, page: MashroomPortalPage, adminPluginName: ?string) {
        const loadStatements = [];
        if (page.portalApps) {
            for (const areaId in page.portalApps) {
                if (areaId && page.portalApps.hasOwnProperty(areaId)) {
                    for (const portalAppInstance of page.portalApps[areaId]) {
                        const portalApp = this._getPortalApp(portalAppInstance.pluginName);
                        if (portalApp) {
                            if (!await isAppPermitted(req, portalApp, portalAppInstance.instanceId)) {
                                continue;
                            }

                            if (portalAppInstance.instanceId) {
                                loadStatements.push(
                                    `portalAppService.loadApp('${areaId}', '${portalAppInstance.pluginName}', '${portalAppInstance.instanceId}', null, null);`
                                );
                            } else {
                                loadStatements.push(
                                    `portalAppService.loadApp('${areaId}', '${portalAppInstance.pluginName}', null, null, null);`
                                );
                            }
                        }
                    }
                }
            }
        }

        if (adminPluginName) {
            loadStatements.push(
                `portalAppService.loadApp('mashroom-portal-admin-app-container', '${adminPluginName}', null, null, null);`
            );
        }

        return `
            <script>
                var portalAppService = ${WINDOW_VAR_PORTAL_SERVICES}.portalAppService;
                ${loadStatements.join('\n')}
            </script>
        `;
    }

    _getPortalApp(pluginName: string) {
        return this.pluginRegistry.portalApps.find((pa) => pa.name === pluginName);
    }
}
