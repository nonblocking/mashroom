// @flow

import {cloneAndFreezeArray} from '@mashroom/mashroom-utils/lib/readonly_utils';

import type {
    MashroomPortalApp,
    MashroomPortalLayout,
    MashroomPortalPluginRegistry as MashroomPortalPluginRegistryType,
    MashroomPortalTheme,
    MashroomRemotePortalAppRegistryHolder
} from '../../../type-definitions';

export default class MashroomPortalPluginRegistry implements MashroomPortalPluginRegistryType {

    _portalApps: Array<MashroomPortalApp>;
    _themes: Array<MashroomPortalTheme>;
    _layouts: Array<MashroomPortalLayout>;
    _remotePortalAppRegistries: Array<MashroomRemotePortalAppRegistryHolder>;

    constructor() {
        this._portalApps = [];
        this._themes = [];
        this._layouts = [];
        this._remotePortalAppRegistries = [];
    }

    registerPortalApp(portalApp: MashroomPortalApp) {
        this.unregisterPortalApp(portalApp.name);
        this._portalApps.push(portalApp);
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
    }

    unregisterLayout(layoutName: string) {
        const idx = this._layouts.findIndex((pa) => pa.name === layoutName);
        if (idx !== -1) {
            this._layouts.splice(idx, 1);
        }
    }

    registerRemotePortalAppRegistry(registry: MashroomRemotePortalAppRegistryHolder) {
        this.unregisterRemotePortalAppRegistry(registry.name);
        this._remotePortalAppRegistries.push(registry);
    }

    unregisterRemotePortalAppRegistry(name: string) {
        const idx = this._remotePortalAppRegistries.findIndex((holder) => holder.name === name);
        if (idx !== -1) {
            this._remotePortalAppRegistries.splice(idx, 1);
        }
    }

    get portalApps(): Array<MashroomPortalApp> {
        const registryHolders = [...this._remotePortalAppRegistries, { registry: { portalApps: this._portalApps }, priority: 0 }];
        registryHolders.sort((a, b) => b.priority - a.priority);
        let apps = [];
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

    get themes(): Array<MashroomPortalTheme> {
        return cloneAndFreezeArray(this._themes);
    }

    get layouts(): Array<MashroomPortalLayout> {
        return cloneAndFreezeArray(this._layouts);
    }

}
