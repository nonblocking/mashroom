// @flow

import type {LogLevel} from "@mashroom/mashroom/type-definitions";
import type {
    MashroomPortalApp,
    MashroomPortalAppEnhancement,
    MashroomPortalLayout,
    MashroomPortalPageEnhancement,
    MashroomPortalTheme,
    MashroomRemotePortalAppRegistry,
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

    +portalPageEnhancements: Array<MashroomPortalPageEnhancement>;

    +portalAppEnhancements: Array<MashroomPortalAppEnhancement>;

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

export type MashroomPortalRegisterListener = (MashroomPortalPluginType, MashroomPortalApp | MashroomPortalLayout | MashroomPortalTheme | MashroomRemotePortalAppRegistryHolder | MashroomPortalPageEnhancement | MashroomPortalAppEnhancement) => void;

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
    +portalPluginConfig: MashroomPortalPluginConfig,
}

export type ClientLogMessage = {|
    level: LogLevel,
    portalAppName?: ?string,
    message: string
|}
