// @flow

import {promisify} from 'util';
import fs from 'fs';
import {determineUserAgent} from '@mashroom/mashroom-utils/lib/user_agent_utils';
import context from '../context/global_portal_context';
import minimalLayout from '../layouts/minimal_layout';
import minimalTemplatePortal from '../theme/minimal_template_portal';
import {
    PORTAL_APP_API_PATH,
    PORTAL_JS_FILE,
    PORTAL_THEME_RESOURCES_BASE_PATH,
    WINDOW_VAR_PORTAL_API_PATH,
    WINDOW_VAR_PORTAL_APP_LOADING_FAILED_MSG,
    WINDOW_VAR_PORTAL_AUTO_EXTEND_AUTHENTICATION,
    WINDOW_VAR_PORTAL_CHECK_AUTHENTICATION_EXPIRATION,
    WINDOW_VAR_PORTAL_DEV_MODE,
    WINDOW_VAR_PORTAL_LANGUAGE,
    WINDOW_VAR_PORTAL_PAGE_ID,
    WINDOW_VAR_PORTAL_SERVICES,
    WINDOW_VAR_PORTAL_SITE_ID,
    WINDOW_VAR_PORTAL_SITE_URL,
    WINDOW_VAR_PORTAL_WARN_BEFORE_AUTHENTICATION_EXPIRES_SEC,
    WINDOW_VAR_REMOTE_MESSAGING_CONNECT_PATH,
    WINDOW_VAR_REMOTE_MESSAGING_PRIVATE_USER_TOPIC,
} from '../constants';
import SitePagesTraverser from '../utils/SitePagesTraverser';
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

import type {
    ExpressApplication,
    ExpressRequest,
    ExpressResponse,
    MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomSecurityService, MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomCSRFService} from '@mashroom/mashroom-csrf-protection/type-definitions';
import type {MashroomMessagingService} from '@mashroom/mashroom-messaging/type-definitions';
import type {
    MashroomPortalPage,
    MashroomPortalPageRef,
    MashroomPortalPageRefLocalized,
    MashroomPortalPageRenderModel,
    MashroomPortalSite,
    MashroomPortalSiteLocalized,
} from '../../../type-definitions';
import type {MashroomPortalPluginRegistry,} from '../../../type-definitions/internal';

const readFile = promisify(fs.readFile);
const viewEngineCache = new Map();

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
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.portal');

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
            const layoutName = page.layout || site.defaultLayout;

            const portalName = req.pluginContext.serverConfig.name;
            const devMode = req.pluginContext.serverInfo.devMode;
            const model = await this._createPortalPageModel(req, portalName, devMode, portalPath, sitePath, site, pageRef, page, themeName, layoutName, logger);

            this._render(themeName, model, res, logger);

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }

    async _createPortalPageModel(req: ExpressRequest, portalName: string, devMode: boolean, portalPath: string, sitePath: string,
                                 site: MashroomPortalSite, pageRef: MashroomPortalPageRef, page: MashroomPortalPage,
                                 themeName: ?string, layoutName: ?string, logger: MashroomLogger): Promise<MashroomPortalPageRenderModel> {
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

        let checkAuthenticationExpiration = false;
        if (user) {
            checkAuthenticationExpiration = true;
        }
        const warnBeforeAuthenticationExpiresSec = context.portalPluginConfig.warnBeforeAuthenticationExpiresSec;
        const autoExtendAuthentication = context.portalPluginConfig.autoExtendAuthentication;
        const messagingConnectPath = webSocketSupport && messagingService && messagingService.getWebSocketConnectPath(req);
        const privateUserTopic = user && messagingService && messagingService.getUserPrivateTopic(req);

        const appLoadingFailedMsg = i18nService.getMessage('portalAppLoadingFailed', lang);
        const portalLayout = await this._loadLayout(layoutName, logger);
        const portalResourcesHeader = this._resourcesHeader(req, portalPath, site.siteId, sitePath, pageRef.pageId, lang,
            appLoadingFailedMsg, checkAuthenticationExpiration, warnBeforeAuthenticationExpiresSec, autoExtendAuthentication,
            messagingConnectPath, privateUserTopic, devMode);
        const portalResourcesFooter = await this._resourcesFooter(req, page, adminPluginName);
        const siteBasePath = getFrontendSiteBasePath(req);
        let resourcesBasePath = null;
        if (themeName) {
            const encodedThemeName = encodeURIComponent(themeName);
            resourcesBasePath = `${getFrontendApiResourcesBasePath(req)}${PORTAL_THEME_RESOURCES_BASE_PATH}/${encodedThemeName}`;
        }
        const apiBasePath = `${getFrontendApiResourcesBasePath(req)}${PORTAL_APP_API_PATH}`;

        const localizedPageRef = this._localizePageRef(req, pageRef);
        // $FlowFixMe
        const mergedPageData = {...localizedPageRef, ...page};
        const localizedSite = await this._localizeSiteAndFilterPages(req, site);
        const userAgent = determineUserAgent(req);

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
                let engine;
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
                window['${WINDOW_VAR_PORTAL_API_PATH}'] = '${getFrontendApiResourcesBasePath(req)}${PORTAL_APP_API_PATH}';
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
            <script src="${getFrontendApiResourcesBasePath(req)}/${PORTAL_JS_FILE}?v=${this.startTimestamp}"></script>
        `;
    }

    async _resourcesFooter(req: ExpressRequest, page: MashroomPortalPage, adminPluginName: ?string) {
        const loadStatements = [];
        if (page.portalApps) {
            for (const areaId in page.portalApps) {
                if (areaId && page.portalApps.hasOwnProperty(areaId)) {
                    for (const portalAppInstance of page.portalApps[areaId]) {
                        const portalApp = this._getPortalApp(portalAppInstance.pluginName);
                        if (!await isAppPermitted(req, portalAppInstance.pluginName, portalAppInstance.instanceId, portalApp)) {
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
