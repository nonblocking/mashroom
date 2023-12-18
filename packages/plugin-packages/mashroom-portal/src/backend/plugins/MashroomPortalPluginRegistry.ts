
import {readonlyUtils} from '@mashroom/mashroom-utils';

import type {
    MashroomPortalApp,
    MashroomPortalLayout,
    MashroomPortalTheme,
    MashroomPortalPageEnhancement,
    MashroomPortalAppEnhancement
} from '../../../type-definitions';
import type {
    MashroomPortalPluginRegistry as MashroomPortalPluginRegistryType,
    MashroomPortalRegisterListener,
    MashroomRemotePortalAppRegistryHolder
} from '../../../type-definitions/internal';

export default class MashroomPortalPluginRegistry implements MashroomPortalPluginRegistryType {

    private _portalApps: Array<MashroomPortalApp>;
    private _themes: Array<MashroomPortalTheme>;
    private _layouts: Array<MashroomPortalLayout>;
    private _remotePortalAppRegistries: Array<MashroomRemotePortalAppRegistryHolder>;
    private _portalPageEnhancements: Array<MashroomPortalPageEnhancement>;
    private _portalAppEnhancements: Array<MashroomPortalAppEnhancement>;
    private _registerListeners: Array<MashroomPortalRegisterListener>;

    constructor() {
        this._portalApps = [];
        this._themes = [];
        this._layouts = [];
        this._remotePortalAppRegistries = [];
        this._portalPageEnhancements = [];
        this._portalAppEnhancements = [];
        this._registerListeners = [];
    }

    registerPortalApp(portalApp: MashroomPortalApp): void {
        this.unregisterPortalApp(portalApp.name);
        this._portalApps.push(portalApp);
        this._registerListeners.forEach(listener => listener('app', portalApp));
    }

    unregisterPortalApp(pluginName: string): void {
        const idx = this._portalApps.findIndex((pa) => pa.name === pluginName);
        if (idx !== -1) {
            this._portalApps.splice(idx, 1);
        }
    }

    registerTheme(theme: MashroomPortalTheme): void {
        this.unregisterTheme(theme.name);
        this._themes.push(theme);
        this._registerListeners.forEach(listener => listener('theme', theme));
    }

    unregisterTheme(themeName: string): void {
        const idx = this._themes.findIndex((pa) => pa.name === themeName);
        if (idx !== -1) {
            this._themes.splice(idx, 1);
        }
    }

    registerLayout(layout: MashroomPortalLayout): void {
        this.unregisterLayout(layout.name);
        this._layouts.push(layout);
        this._registerListeners.forEach(listener => listener('layout', layout));
    }

    unregisterLayout(layoutName: string): void {
        const idx = this._layouts.findIndex((pa) => pa.name === layoutName);
        if (idx !== -1) {
            this._layouts.splice(idx, 1);
        }
    }

    registerRemotePortalAppRegistry(registry: MashroomRemotePortalAppRegistryHolder): void {
        this.unregisterRemotePortalAppRegistry(registry.name);
        this._remotePortalAppRegistries.push(registry);
        this._registerListeners.forEach(listener => listener('registry', registry));
    }

    unregisterRemotePortalAppRegistry(name: string): void {
        const idx = this._remotePortalAppRegistries.findIndex((holder) => holder.name === name);
        if (idx !== -1) {
            this._remotePortalAppRegistries.splice(idx, 1);
        }
    }

    registerPortalPageEnhancement(enhancement: MashroomPortalPageEnhancement): void {
        this.unregisterPortalPageEnhancement(enhancement.name);
        this._portalPageEnhancements.push(enhancement);
        this._registerListeners.forEach(listener => listener('page-enhancement', enhancement));
    }

    unregisterPortalPageEnhancement(name: string): void {
        const idx = this._portalPageEnhancements.findIndex((holder) => holder.name === name);
        if (idx !== -1) {
            this._portalPageEnhancements.splice(idx, 1);
        }
    }

    registerPortalAppEnhancement(enhancement: MashroomPortalAppEnhancement): void {
        this.unregisterPortalAppEnhancement(enhancement.name);
        this._portalAppEnhancements.push(enhancement);
        this._registerListeners.forEach(listener => listener('app-enhancement', enhancement));
    }

    unregisterPortalAppEnhancement(name: string): void {
        const idx = this._portalAppEnhancements.findIndex((holder) => holder.name === name);
        if (idx !== -1) {
            this._portalAppEnhancements.splice(idx, 1);
        }
    }

    addRegisterListener(listener: MashroomPortalRegisterListener): void {
        this._registerListeners.push(listener);
    }

    removeRegisterListener(listener: MashroomPortalRegisterListener): void {
        this._registerListeners = this._registerListeners.filter((l) => l !== listener);
    }

    get portalApps(): Readonly<Array<MashroomPortalApp>> {
        const registryHolders = [...this._remotePortalAppRegistries, { registry: { portalApps: this._portalApps }, priority: 0 }];
        registryHolders.sort((a, b) => b.priority - a.priority);
        let apps: Array<MashroomPortalApp> = [];
        for (const registryHolder of registryHolders) {
            const portalApps = registryHolder.registry.portalApps;
            if (apps.length === 0) {
                apps = [...portalApps];
            } else {
                for (const app of portalApps) {
                    if (apps.findIndex((a) => a.name === app.name) === -1) {
                        apps.push(app);
                    }
                }
            }
        }

        return Object.freeze(apps);
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

}
