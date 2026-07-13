
import {readonlyUtils} from '@mashroom/mashroom-utils';

import type {
    MashroomPortalApp,
    MashroomPortalLayout,
    MashroomPortalTheme,
    MashroomPortalPageEnhancement,
    MashroomPortalAppEnhancement,
    MashroomPortalAppConfig,
} from '../../../type-definitions';
import type {
    MashroomPortalPluginRegistry as MashroomPortalPluginRegistryType,
    MashroomPortalRegisterListener,
} from '../../../type-definitions/internal';

export default class MashroomPortalPluginRegistry implements MashroomPortalPluginRegistryType {

    private _portalApps: Array<MashroomPortalApp>;
    private _themes: Array<MashroomPortalTheme>;
    private _layouts: Array<MashroomPortalLayout>;
    private _portalPageEnhancements: Array<MashroomPortalPageEnhancement>;
    private _portalAppEnhancements: Array<MashroomPortalAppEnhancement>;
    private _portalAppConfigs: Array<MashroomPortalAppConfig>;
    private _registerListeners: Array<MashroomPortalRegisterListener>;

    constructor() {
        this._portalApps = [];
        this._themes = [];
        this._layouts = [];
        this._portalPageEnhancements = [];
        this._portalAppEnhancements = [];
        this._portalAppConfigs = [];
        this._registerListeners = [];
    }

    registerPortalApp(portalApp: MashroomPortalApp) {
        this.unregisterPortalApp(portalApp.name);
        this._portalApps.push(portalApp);
        this._registerListeners.forEach(listener => listener('app', portalApp));
    }

    unregisterPortalApp(pluginName: string) {
        const idx = this._portalApps.findIndex((pa) => pa.name === pluginName);
        if (idx !== -1) {
            this._portalApps.splice(idx, 1);
        }
    }

    registerTheme(theme: MashroomPortalTheme) {
        this.unregisterTheme(theme.name);
        this._themes.push(theme);
        this._registerListeners.forEach(listener => listener('theme', theme));
    }

    unregisterTheme(themeName: string) {
        const idx = this._themes.findIndex((pa) => pa.name === themeName);
        if (idx !== -1) {
            this._themes.splice(idx, 1);
        }
    }

    registerLayout(layout: MashroomPortalLayout) {
        this.unregisterLayout(layout.name);
        this._layouts.push(layout);
        this._registerListeners.forEach(listener => listener('layout', layout));
    }

    unregisterLayout(layoutName: string) {
        const idx = this._layouts.findIndex((pa) => pa.name === layoutName);
        if (idx !== -1) {
            this._layouts.splice(idx, 1);
        }
    }

    registerPortalPageEnhancement(enhancement: MashroomPortalPageEnhancement) {
        this.unregisterPortalPageEnhancement(enhancement.name);
        this._portalPageEnhancements.push(enhancement);
        this._registerListeners.forEach(listener => listener('page-enhancement', enhancement));
    }

    unregisterPortalPageEnhancement(name: string) {
        const idx = this._portalPageEnhancements.findIndex((holder) => holder.name === name);
        if (idx !== -1) {
            this._portalPageEnhancements.splice(idx, 1);
        }
    }

    registerPortalAppEnhancement(enhancement: MashroomPortalAppEnhancement) {
        this.unregisterPortalAppEnhancement(enhancement.name);
        this._portalAppEnhancements.push(enhancement);
        this._registerListeners.forEach(listener => listener('app-enhancement', enhancement));
    }

    unregisterPortalAppEnhancement(name: string) {
        const idx = this._portalAppEnhancements.findIndex((holder) => holder.name === name);
        if (idx !== -1) {
            this._portalAppEnhancements.splice(idx, 1);
        }
    }

    registerPortalAppConfig(portalAppConfig: MashroomPortalAppConfig) {
        this.unregisterPortalAppConfig(portalAppConfig.name);
        this._portalAppConfigs.push(portalAppConfig);
        this._registerListeners.forEach(listener => listener('portal-app-config', portalAppConfig));
    }

    unregisterPortalAppConfig(name: string) {
        const idx = this._portalAppConfigs.findIndex((holder) => holder.name === name);
        if (idx !== -1) {
            this._portalAppConfigs.splice(idx, 1);
        }
    }

    addRegisterListener(listener: MashroomPortalRegisterListener) {
        this._registerListeners.push(listener);
    }

    removeRegisterListener(listener: MashroomPortalRegisterListener) {
        this._registerListeners = this._registerListeners.filter((l) => l !== listener);
    }

    get portalApps(): Readonly<Array<MashroomPortalApp>> {
        return readonlyUtils.cloneAndFreezeArray(this._portalApps);
    }

    get themes(): Readonly<Array<MashroomPortalTheme>> {
        return readonlyUtils.cloneAndFreezeArray(this._themes);
    }

    get layouts(): Readonly<Array<MashroomPortalLayout>> {
        return readonlyUtils.cloneAndFreezeArray(this._layouts);
    }

    get portalPageEnhancements(): Readonly<Array<MashroomPortalPageEnhancement>> {
        return readonlyUtils.cloneAndFreezeArray(this._portalPageEnhancements);
    }

    get portalAppEnhancements(): Readonly<Array<MashroomPortalAppEnhancement>> {
        return readonlyUtils.cloneAndFreezeArray(this._portalAppEnhancements);
    }

    get portalAppConfigs(): Readonly<Array<MashroomPortalAppConfig>> {
        return readonlyUtils.cloneAndFreezeArray(this._portalAppConfigs);
    }
}
