
import type {Request} from 'express';
import type {LogLevel} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalApp,
    MashroomPortalAppEnhancement,
    MashroomPortalLayout,
    MashroomPortalPageEnhancement,
    MashroomPortalTheme,
    MashroomPortalAppSetup,
    UserAgent,
} from './api';

export type Writable<Type> = {
    -readonly [Key in keyof Type]: Type[Key];
};

export interface MashroomRestService {
    get(path: string, extraHeaders?: Record<string, string>): Promise<any>;

    post(path: string, data: any, extraHeaders?: Record<string, string>): Promise<any>;

    put(path: string, data: any, extraHeaders?: Record<string, string>): Promise<void>;

    delete(path: string, extraHeaders?: Record<string, string>): Promise<void>;

    withBasePath(apiBasePath: string): MashroomRestService;
}

export interface MashroomPortalPluginRegistry {
    readonly portalApps: Readonly<Array<MashroomPortalApp>>;

    readonly themes: Readonly<Array<MashroomPortalTheme>>;

    readonly layouts: Readonly<Array<MashroomPortalLayout>>;

    readonly portalPageEnhancements: Readonly<Array<MashroomPortalPageEnhancement>>;

    readonly portalAppEnhancements: Readonly<Array<MashroomPortalAppEnhancement>>;

    registerPortalApp(portalApp: MashroomPortalApp): void;

    unregisterPortalApp(pluginName: string): void;

    registerTheme(theme: MashroomPortalTheme): void;

    unregisterTheme(themeName: string): void;

    registerLayout(layout: MashroomPortalLayout): void;

    unregisterLayout(layoutName: string): void;

    registerPortalPageEnhancement(enhancement: MashroomPortalPageEnhancement): void;

    unregisterPortalPageEnhancement(name: string): void;

    registerPortalAppEnhancement(enhancement: MashroomPortalAppEnhancement): void;

    unregisterPortalAppEnhancement(name: string): void;

    addRegisterListener(listener: MashroomPortalRegisterListener): void;

    removeRegisterListener(listener: MashroomPortalRegisterListener): void;
}

export type MashroomPortalPluginType = 'app' | 'theme' | 'layout' | 'app-enhancement' | 'page-enhancement';

export type MashroomPortalRegisterListener = (pluginType: MashroomPortalPluginType, listener: MashroomPortalApp | MashroomPortalLayout | MashroomPortalTheme | MashroomPortalPageEnhancement | MashroomPortalAppEnhancement) => void;

export type MashroomPortalOnAuthenticationExpirationStrategies = {
    readonly strategy: 'stayOnPage';
} | {
    readonly strategy: 'reload';
} | {
    readonly strategy: 'redirect';
    readonly url: string;
} | {
    readonly strategy: 'displayDomElement';
    readonly elementId: string;
};

export type MashroomPortalPluginConfig = {
    readonly path: string;
    readonly adminApp: string | null | undefined;
    readonly defaultTheme: string;
    readonly defaultLayout: string;
    readonly authenticationExpiration: {
        readonly warnBeforeExpirationSec: number;
        readonly autoExtend: boolean;
        readonly onExpiration: MashroomPortalOnAuthenticationExpirationStrategies;
    };
    readonly ignoreMissingAppsOnPages: boolean;
    readonly versionHashSalt: string | null | undefined;
    readonly resourceFetchConfig: {
        readonly fetchTimeoutMs: number;
        readonly httpMaxSocketsPerHost: number;
        readonly httpRejectUnauthorized: boolean;
    },
    readonly defaultProxyConfig: {
        readonly sendPermissionsHeader?: boolean;
        readonly restrictToRoles?: Array<string>;
    };
    readonly ssrConfig: {
        readonly ssrEnable: boolean;
        readonly renderTimoutMs: number;
        readonly cacheEnable: boolean;
        readonly cacheTTLSec: number;
        readonly inlineStyles: boolean;
    };
}

export type MashroomPortalPageApps = {
    [areaId: string]: Array<{
        readonly pluginName: string;
        readonly instanceId: string;
        readonly priority?: number;
        readonly appSetup: MashroomPortalAppSetup;
    }>
}

export type MashroomPortalContext = {
    readonly startTs: number;
    readonly pluginRegistry: MashroomPortalPluginRegistry;
    readonly portalPluginConfig: MashroomPortalPluginConfig;
}

export type MashroomPortalContentRenderResult = {
    readonly resultHtml: string;
    readonly serverSideRenderedApps: Array<string>;
    readonly serverSideRenderingInjectHeadScript: Array<string>;
    readonly embeddedPortalPageApps: MashroomPortalPageApps;
}

export type MashroomPortalIncludeStyleServerSideRenderedAppsResult = {
    readonly headerContent: string;
    readonly includedAppStyles: Array<string>;
}

export type MashroomPortalHeaderRenderModel = {
    readonly req: Request;
    readonly siteId: string;
    readonly sitePath: string;
    readonly pageId: string;
    readonly pageFriendlyUrl: string;
    readonly lang: string;
    readonly appWrapperTemplateHtml: string;
    readonly appErrorTemplateHtml: string;
    readonly appLoadingFailedMsg: string;
    readonly checkAuthenticationExpiration: boolean;
    readonly authenticationExpiration: MashroomPortalPluginConfig['authenticationExpiration'];
    readonly authenticationExpiredMessage: string;
    readonly messagingConnectPath: string | undefined | null;
    readonly privateUserTopic: string | undefined | null;
    readonly userAgent: UserAgent, cdnHost: string | undefined | null;
    readonly inlineStyleHeaderContent: string;
    readonly includedAppStyles: Array<string>;
    readonly serverSideRenderingInjectHeadScript: Array<string>;
    readonly devMode: boolean;
}

export type MashroomPortalFooterRenderModel = {
    readonly req: Request;
    readonly portalPageApps: MashroomPortalPageApps;
    readonly adminPluginName: string | undefined | null;
    readonly sitePath: string;
    readonly pageFriendlyUrl: string;
    readonly lang: string;
    readonly userAgent: UserAgent;
};

export type ClientLogMessage = {
    readonly level: LogLevel;
    readonly portalAppName?: string | undefined | null;
    readonly path: string;
    readonly message: string;
}

export type SSRRenderResult = {
    readonly html: string;
    readonly injectHeadScript: Array<string>;
    readonly embeddedPortalPageApps: MashroomPortalPageApps;
}
