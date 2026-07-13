import type {Request} from 'express';
import type {MashroomPluginContext, I18NString} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {
    MashroomPortalAppInstanceRef,
    MashroomPortalPage,
    MashroomPortalService
} from '@mashroom/mashroom-portal/type-definitions';

export const findPluginPackage = (url: URL, pluginContext: MashroomPluginContext) => {
    const pluginService = pluginContext.services.core.pluginService;
    return pluginService.getPotentialPluginPackages().find((pp) => pp.url.toString() === url.toString());
};

const determinePortalBasePath = (req: Request): string => {
  const portalPlugin = req.pluginContext.services.core.pluginService.getPlugins().find((p) => p.name === 'Mashroom Portal WebApp');
  if (portalPlugin) {
    return portalPlugin.config?.path ?? '/portal';
  }
  return '/portal';
};

export const determineServerUrl = (req: Request): string => {
    const portalBasePath = determinePortalBasePath(req);

    const forwardedHost = req.headers['x-forwarded-host'] as string | undefined;
    if (forwardedHost) {
        const hostname = forwardedHost.split(',')[0];
        const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ?? 'http';
        const port = (req.headers['x-forwarded-port'] as string | undefined)?.split(',')[0];

        return `${proto}://${hostname}${port ? `:${port}` : ''}${portalBasePath}`;
    }

    return `http://${req.host}${portalBasePath}`;
};

export const determineSiteAndPageRef = async (pageId: string, pluginContext: MashroomPluginContext) => {
    const portalService = pluginContext.services.portal!.service as MashroomPortalService;
    const sites = await portalService.getSites();
    let pageRef;
    let site;
    for (const s of sites) {
        pageRef = await portalService.findPageRefByPageId(s, pageId);
        if (pageRef) {
            site = s;
            break;
        }
    }

    return {
        site,
        pageRef,
    };
};

export const insertAppInstance = (page: MashroomPortalPage, portalAppInstance: MashroomPortalAppInstanceRef, areaId: string, position?: number): number => {
    (page as any).portalApps = page.portalApps || {};
    const areaAppInstances = page.portalApps![areaId] = page.portalApps![areaId] || [];

    let actualPos = areaAppInstances.length;
    if (typeof (position) === 'number' && position >= 0 && position < areaAppInstances.length) {
        actualPos = position;
    }

    areaAppInstances.splice(actualPos, 0, portalAppInstance);

    return actualPos;
};

export const getPortalAppResourceKey = (pluginName: string, instanceId: string | undefined | null) => {
    return `${pluginName}_${instanceId || 'global'}`;
};

export const serializeI18NString = (i18nString: I18NString | null | undefined, pluginContext: MashroomPluginContext) => {
    if (!i18nString) {
        return '';
    }
    if (typeof i18nString === 'string') {
        return i18nString;
    }

    const i18nService: MashroomI18NService = pluginContext.services.i18n!.service;
    const defaultLanguage = i18nService.defaultLanguage;

    const defaultMessageKey = i18nString[defaultLanguage] ? defaultLanguage : Object.keys(i18nString)[0];
    const defaultMessage = i18nString[defaultMessageKey];
    const translations = Object.keys(i18nString)
        .filter((lang) => lang !== defaultLanguage)
        .map((lang) => `${lang}: ${i18nString[lang]}`)
        .join(', ');

    return `${defaultMessage} (Translations: ${translations})`;
};
