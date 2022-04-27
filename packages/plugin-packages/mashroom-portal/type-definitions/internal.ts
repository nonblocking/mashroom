
import type {LogLevel} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalApp,
    MashroomPortalAppEnhancement,
    MashroomPortalLayout,
    MashroomPortalPageEnhancement,
    MashroomPortalTheme,
    MashroomRemotePortalAppRegistry,
    MashroomPortalAppSetup,
} from './api';

export interface MashroomRestService {
    get(path: string, extraHeaders?: Record<string, string>): Promise<any>;

    post(path: string, data: any, extraHeaders?: Record<string, string>): Promise<any>;

    put(path: string, data: any, extraHeaders?: Record<string, string>): Promise<void>;

    delete(path: string, extraHeaders?: Record<string, string>): Promise<void>;

    withBasePath(apiBasePath: string): MashroomRestService;
}

export interface MashroomRemotePortalAppRegistryHolder {
    readonly name: string;
    readonly priority: number;
    readonly registry: MashroomRemotePortalAppRegistry;
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

    registerRemotePortalAppRegistry(registry: MashroomRemotePortalAppRegistryHolder): void;

    unregisterRemotePortalAppRegistry(name: string): void;

    registerPortalPageEnhancement(enhancement: MashroomPortalPageEnhancement): void;

    unregisterPortalPageEnhancement(name: string): void;

    registerPortalAppEnhancement(enhancement: MashroomPortalAppEnhancement): void;

    unregisterPortalAppEnhancement(name: string): void;

    addRegisterListener(listener: MashroomPortalRegisterListener): void;

    removeRegisterListener(listener: MashroomPortalRegisterListener): void;
}

export type MashroomPortalPluginType = 'app' | 'theme' | 'layout' | 'registry' | 'app-enhancement' | 'page-enhancement';

export type MashroomPortalRegisterListener = (pluginType: MashroomPortalPluginType, listener: MashroomPortalApp | MashroomPortalLayout | MashroomPortalTheme | MashroomRemotePortalAppRegistryHolder | MashroomPortalPageEnhancement | MashroomPortalAppEnhancement) => void;

export type MashroomPortalPluginConfig = {
    readonly path: string;
    readonly adminApp: string | null | undefined;
    readonly defaultTheme: string;
    readonly defaultLayout: string;
    readonly warnBeforeAuthenticationExpiresSec: number;
    readonly autoExtendAuthentication: boolean;
    readonly defaultProxyConfig: {
        readonly sendPermissionsHeader?: boolean;
        readonly restrictToRoles?: Array<string>;
    };
    readonly ssrConfig: {
        readonly ssrEnabled: boolean;
        readonly renderTimoutMs: number;
        readonly cacheTTLSec: number;
        readonly inlineStyles: boolean;
    };
}

export type MashroomPortalPageAppsInfo = {
    [areaId: string]: Array<{
        pluginName: string;
        instanceId: string;
        appSetup: MashroomPortalAppSetup;
    }>
}

export type MashroomPortalContext = {
    readonly startTs: number;
    readonly pluginRegistry: MashroomPortalPluginRegistry;
    readonly portalPluginConfig: MashroomPortalPluginConfig;
}

export type MashroomPortalPageContentRenderResult = {
    readonly pageContent: string;
    readonly serverSideRenderedApps: Array<string>;
}

export type MashroomPortalIncludeStyleServerSideRenderedAppsResult = {
    readonly headerContent: string;
    readonly includedAppStyles: Array<string>;
}

export type ClientLogMessage = {
    level: LogLevel;
    portalAppName?: string | undefined | null;
    path: string;
    message: string;
}
