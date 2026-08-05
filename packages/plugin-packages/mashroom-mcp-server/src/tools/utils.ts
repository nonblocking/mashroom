import {readFile} from 'fs/promises';
import type {Request} from 'express';
import type {MashroomPluginContext, I18NString} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {
    MashroomPortalAppInstanceRef,
    MashroomPortalPage, MashroomPortalPageRef,
    MashroomPortalService, MashroomPortalSite
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

const findPageRef = (pageId: string, parentPageRef: MashroomPortalPageRef | undefined, pages: Array<MashroomPortalPageRef>): { pageRef: MashroomPortalPageRef, parentPageRef?: MashroomPortalPageRef } | undefined => {
    for (const pageRef of pages) {
        if (pageRef.pageId === pageId) {
            return {
                pageRef,
                parentPageRef,
            };
        }
        const childRef = findPageRef(pageId, pageRef, pageRef.subPages || []);
        if (childRef) {
            return childRef;
        }
    }
    return undefined;
};

export const determineSiteAndPageRef = async (pageId: string, pluginContext: MashroomPluginContext) => {
    const portalService = pluginContext.services.portal!.service as MashroomPortalService;
    const sites = await portalService.getSites();
    for (const site of sites) {
        const { pageRef, parentPageRef } = findPageRef(pageId, undefined, site.pages) ?? {};
        if (pageRef) {
            return {
                site,
                pageRef,
                parentPageRef,
            };
        }
    }

    return undefined;
};

export const removePageFromTree = (pageRef: MashroomPortalPageRef, parentPageRef: MashroomPortalPageRef | undefined, pages: Array<MashroomPortalPageRef>) => {
    const subPages = parentPageRef ? parentPageRef.subPages ?? [] : pages;
    const existing = subPages.find((p) => p.pageId === pageRef.pageId);
    if (existing) {
        const index = subPages.findIndex((p) => p.pageId === pageRef.pageId);
        subPages.splice(index, 1);
    }
};

export const replaceInTree = (pageRef: MashroomPortalPageRef, parentPageRef: MashroomPortalPageRef | undefined, site: MashroomPortalSite) => {
    const subPages = parentPageRef ? parentPageRef.subPages ?? [] : site.pages;
    const newPages = subPages.map((p) => p.pageId === pageRef.pageId ? pageRef : p);
    if (parentPageRef) {
        (parentPageRef as any).subPages = newPages;
    } else {
        (site as any).pages = newPages;
    }
};

export const getNestedPages = (pageRef: MashroomPortalPageRef): Array<MashroomPortalPageRef> => {
    const nestedPages: Array<MashroomPortalPageRef> = [];
    const addNestedPages = (pages: Array<MashroomPortalPageRef>) => {
        pages.forEach((p) => {
            nestedPages.push(p);
            if (p.subPages) {
                addNestedPages(p.subPages);
            }
        });
    };
    addNestedPages(pageRef.subPages || []);
    return nestedPages;
};

export const getLayoutTemplate = async (layoutName: string, pluginContext: MashroomPluginContext) => {
    const portalService = pluginContext.services.portal!.service as MashroomPortalService;
    const logger = pluginContext.loggerFactory('mashroom.mcp');
    const layout = portalService.getLayouts().find((p) => p.layoutId === layoutName);
    if (layout) {
        try {
            return await readFile(layout.layoutPath, { encoding: 'utf-8' });
        } catch (e) {
            logger.warn(`Error reading layout file: ${layout.layoutPath}`, e);
        }
    }
    return null;
};

export const determineLayoutAreaIds = async (layoutName: string, pluginContext: MashroomPluginContext) => {
    const layoutTemplate = await getLayoutTemplate(layoutName, pluginContext);
    if (layoutTemplate) {
        return Array.from(layoutTemplate.matchAll(/ id=["'](.+)["']/g)).map((match) => match[1]);
    }
    return [];
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

export const toI18NString = (title: string, translations: Record<string, string> | undefined, pluginContext: MashroomPluginContext): I18NString => {
    const i18nService: MashroomI18NService = pluginContext.services.i18n!.service;
    const defaultLanguage = i18nService.defaultLanguage;

    const i18nString: I18NString = {};
    if (translations) {
        Object.keys(translations).forEach((lang) => {
            i18nString[lang] = translations[lang];
        });
    }
    i18nString[defaultLanguage] = title;

    return i18nString;
};

export const mergeToI18NString = (i18nString: I18NString, newTitle: string | undefined, newTranslations: Record<string, string> | undefined, pluginContext: MashroomPluginContext): I18NString => {
    const i18nService: MashroomI18NService = pluginContext.services.i18n!.service;
    const defaultLanguage = i18nService.defaultLanguage;

    let newI18NString: I18NString;
    if (typeof i18nString === 'string') {
        newI18NString = {
            [defaultLanguage]: i18nString,
        };
    } else {
        newI18NString = {...i18nString};
    }

    if (newTitle) {
        newI18NString[defaultLanguage] = newTitle;
    }
    if (newTranslations) {
        Object.keys(newTranslations).forEach((lang) => {
            newI18NString[lang] = newTranslations[lang];
        });
    }

    return newI18NString;
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
