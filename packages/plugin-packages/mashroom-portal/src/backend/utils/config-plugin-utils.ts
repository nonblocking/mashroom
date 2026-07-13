import type {MashroomPortalPluginRegistry} from '../../../type-definitions/internal';
import type {MashroomPortalAppConfig} from '../../../type-definitions';

const getSortedPortalAppConfigPlugins = (pluginRegistry: MashroomPortalPluginRegistry): Array<MashroomPortalAppConfig> => {
  return pluginRegistry.portalAppConfigs
      .toSorted((p1, p2) => p1.order - p2.order);
};

export const getConfigPluginWithOverwriteProxyTargetUrl = (portalAppName: string, pluginRegistry: MashroomPortalPluginRegistry): MashroomPortalAppConfig | null => {
    return getSortedPortalAppConfigPlugins(pluginRegistry)
        .find((p) => p.plugin.applyTo(portalAppName) && p.plugin.overwriteProxyTargetUrl) ?? null;
};

export const getConfigPluginWithAddProxyRequestHeaders = (portalAppName: string, pluginRegistry: MashroomPortalPluginRegistry): MashroomPortalAppConfig | null => {
    return getSortedPortalAppConfigPlugins(pluginRegistry)
        .find((p) => p.plugin.applyTo(portalAppName) && p.plugin.addProxyRequestHeaders) ?? null;
};

export const getConfigPluginWithAddSSRRouteRequestHeaders = (portalAppName: string, pluginRegistry: MashroomPortalPluginRegistry): MashroomPortalAppConfig | null => {
    return getSortedPortalAppConfigPlugins(pluginRegistry)
        .find((p) => p.plugin.applyTo(portalAppName) && p.plugin.addSSRRouteRequestHeaders) ?? null;
};

export const getConfigPluginWithDetermineRolePermissions = (portalAppName: string, pluginRegistry: MashroomPortalPluginRegistry): MashroomPortalAppConfig | null => {
    return getSortedPortalAppConfigPlugins(pluginRegistry)
        .find((p) => p.plugin.applyTo(portalAppName) && p.plugin.determineRolePermissions) ?? null;
};

export const getConfigPluginWithRewriteImportMap = (portalAppName: string, pluginRegistry: MashroomPortalPluginRegistry): MashroomPortalAppConfig | null => {
    return getSortedPortalAppConfigPlugins(pluginRegistry)
        .find((p) => p.plugin.applyTo(portalAppName) && p.plugin.rewriteImportMap) ?? null;
};
