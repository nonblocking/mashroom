
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
    readonly adminApp: string;
    readonly defaultTheme: string;
    readonly defaultLayout: string;
    readonly warnBeforeAuthenticationExpiresSec: number;
    readonly autoExtendAuthentication: boolean;
    readonly defaultProxyConfig: {
        readonly sendPermissionsHeader?: boolean;
        readonly restrictToRoles?: Array<string>;
    }
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

export type ClientLogMessage = {
    level: LogLevel;
    portalAppName?: string | undefined | null;
    path: string;
    message: string;
}
