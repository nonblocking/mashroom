// @flow

import type {ExpressApplication, LogLevel} from "@mashroom/mashroom/type-definitions";
import type {
    MashroomPortalApp,
    MashroomPortalLayout,
    MashroomPortalTheme,
    MashroomRemotePortalAppRegistry,
    MashroomPortalUpdateListener,
} from './api';

export interface MashroomRemotePortalAppRegistryHolder {
    +name: string;
    +priority: number;
    +registry: MashroomRemotePortalAppRegistry;
}

export interface MashroomPortalPluginRegistry {
    +portalApps: Array<MashroomPortalApp>;
    +themes: Array<MashroomPortalTheme>;
    +layouts: Array<MashroomPortalLayout>;
    addListener(listener: MashroomPortalUpdateListener): void;

    registerPortalApp(portalApp: MashroomPortalApp): void;

    unregisterPortalApp(pluginName: string): void;

    registerTheme(theme: MashroomPortalTheme): void;

    unregisterTheme(themeName: string): void;

    registerLayout(layout: MashroomPortalLayout): void;

    unregisterLayout(layoutName: string): void;

    registerRemotePortalAppRegistry(registry: MashroomRemotePortalAppRegistryHolder): void;

    unregisterRemotePortalAppRegistry(name: string): void;
}

export type MashroomPortalPluginConfig = {
    +path: string,
    +adminApp: string,
    +defaultTheme: string,
    +defaultLayout: string;
    +warnBeforeAuthenticationExpiresSec: number,
    +autoExtendAuthentication: boolean,
}

export type MashroomPortalContext = {
    +startTs: number,
    +pluginRegistry: MashroomPortalPluginRegistry,
    +portalWebapp: ExpressApplication,
    +portalPluginConfig: MashroomPortalPluginConfig,
}

export type ClientLogMessage = {|
    level: LogLevel,
    portalAppName?: ?string,
    message: string
|}
