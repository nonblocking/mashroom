
import {PORTAL_PAGE_TEMPLATE_NAME, PORTAL_APP_WRAPPER_TEMPLATE_NAME, PORTAL_APP_ERROR_TEMPLATE_NAME} from '../constants';
import minimalTemplatePortal from '../theme/minimal-template-portal';
import defaultTemplateAppWrapper from '../theme/default-template-app-wrapper';
import defaultTemplateAppError from '../theme/default-template-app-error';
import {renderServerSide} from './ssr-utils';

import type {Request, Response} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomPortalPageRenderModel,
    MashroomPortalAppErrorRenderModel,
    MashroomPortalAppWrapperRenderModel,
} from '../../../type-definitions';
import type {MashroomPortalPageApps, MashroomPortalContentRenderResult} from '../../../type-definitions/internal';

export const renderPage = async (themeExists: boolean, setupTheme: () => void, model: MashroomPortalPageRenderModel, req: Request, res: Response, logger: MashroomLogger): Promise<string> => {
    const fallback = () => minimalTemplatePortal(model);

    if (themeExists) {
        return renderToString(PORTAL_PAGE_TEMPLATE_NAME, true, setupTheme, model, fallback, res, logger);
    }

    return fallback();
};

export const renderAppWrapper = async (themeExists: boolean, setupTheme: () => void, model: MashroomPortalAppWrapperRenderModel, req: Request, res: Response, logger: MashroomLogger): Promise<string> => {
    const fallback = () => defaultTemplateAppWrapper(model);

    if (themeExists) {
        return renderToString(PORTAL_APP_WRAPPER_TEMPLATE_NAME, false, setupTheme, model, fallback, res, logger);
    }

    return fallback();
};

export const renderAppWrapperToClientTemplate = async (themeExists: boolean, setupTheme: () => void, messages: (key: string) => string, req: Request, res: Response, logger: MashroomLogger): Promise<string> => {
    const model: MashroomPortalAppWrapperRenderModel = {
        appId: '__APP_ID__',
        pluginName: '__PLUGIN_NAME__',
        safePluginName: '__SAFE_PLUGIN_NAME__',
        title: '__TITLE__',
        messages,
        appSSRHtml: null,
    };
    return renderAppWrapper(themeExists, setupTheme, model, req, res, logger);
};

export const renderAppError = async (themeExists: boolean, setupTheme: () => void, model: MashroomPortalAppErrorRenderModel, req: Request, res: Response, logger: MashroomLogger): Promise<string> => {
    const fallback = () => defaultTemplateAppError(model);

    if (themeExists) {
        return renderToString(PORTAL_APP_ERROR_TEMPLATE_NAME, false, setupTheme, model, fallback, res, logger);
    }

    return fallback();
};

export const renderAppErrorToClientTemplate = async (themeExists: boolean, setupTheme: () => void, messages: (key: string) => string, req: Request, res: Response, logger: MashroomLogger): Promise<string> => {
    const model: MashroomPortalAppErrorRenderModel = {
        appId: '__APP_ID__',
        pluginName: '__PLUGIN_NAME__',
        safePluginName: '__SAFE_PLUGIN_NAME__',
        title: '__TITLE__',
        errorMessage: null,
        messages,
    };
    return renderAppError(themeExists, setupTheme, model, req, res, logger);
};

export const insertHtmlIntoPageArea = (hostHtml: string, appAreaId: string, htmlToInsert: string) => {
    const startIdxArea = hostHtml.search(`<[a-zA-Z]+[^>]*id=["']${appAreaId}["']`);
    if (startIdxArea === -1) {
        throw new Error(`No appAreaId ${appAreaId} found`);
    }
    const beginAreaContent = hostHtml.indexOf('>', startIdxArea) + 1;
    return [hostHtml.slice(0, beginAreaContent), htmlToInsert, hostHtml.slice(beginAreaContent)].join('');
};

// Render the Portal Apps into given HTML content
export const renderContent = async (hostHtml: string, portalPageApps: MashroomPortalPageApps, themeExists: boolean, setupTheme: () => void, messages: (key: string) => string, req: Request, res: Response, logger: MashroomLogger): Promise<MashroomPortalContentRenderResult> => {
    const serverSideRenderedApps: Array<string> = [];
    const appAreas = Object.keys(portalPageApps);
    const promises: Array<Promise<Array<string>>> = [];

    const renderEmbeddedPortalAppsFn = async  (hostHtml: string, portalPageApps: MashroomPortalPageApps) => {
        return renderContent(hostHtml, portalPageApps, themeExists, setupTheme, messages, req, res, logger);
    };

    let resultHtml = hostHtml;
    const embeddedPortalPageApps: MashroomPortalPageApps = {};
    for (const appAreaId of appAreas) {
        promises.push(
            Promise.all(
                portalPageApps[appAreaId].map(async ({pluginName, appSetup}) => {
                    const ssrRenderResult = await renderServerSide(pluginName, appSetup, renderEmbeddedPortalAppsFn, req, logger);
                    if (ssrRenderResult && serverSideRenderedApps.indexOf(pluginName) === -1) {
                        serverSideRenderedApps.push(pluginName);
                    }

                    let appSSRHtml = null;
                    if (ssrRenderResult) {
                        appSSRHtml = ssrRenderResult.html;
                        Object.keys(ssrRenderResult.embeddedPortalPageApps).forEach((areaId) => {
                            ssrRenderResult.embeddedPortalPageApps[areaId].forEach((embeddedApp) => {
                                if (serverSideRenderedApps.indexOf(embeddedApp.pluginName) === -1) {
                                    serverSideRenderedApps.push(embeddedApp.pluginName);
                                }
                                embeddedPortalPageApps[areaId] = embeddedPortalPageApps[areaId] || [];
                                embeddedPortalPageApps[areaId].push({
                                    ...embeddedApp,
                                    priority: 10,
                                });
                            });
                        });
                    }

                    const model: MashroomPortalAppWrapperRenderModel = {
                        appId: appSetup.appId,
                        pluginName,
                        safePluginName: getSafePluginName(pluginName),
                        title: appSetup.title || pluginName,
                        messages,
                        appSSRHtml,
                    };
                    return renderAppWrapper(themeExists, setupTheme, model, req, res, logger);
                })
            ).then(
                (result) => result,
                (error) => {
                    logger.error(`Rendering Portal Apps in appArea '${appAreaId}' failed`, error);
                    return [];
                }
            )
        );
    }

    const appAreasAppHtmls = await Promise.all(promises);
    appAreas.forEach((appAreaId, idx) => {
       const appHtmls = appAreasAppHtmls[idx];
       if (appHtmls.length > 0) {
           const appHtml = appHtmls.join('');
           try {
               resultHtml = insertHtmlIntoPageArea(resultHtml, appAreaId, appHtml);
           } catch (e: any) {
               logger.error(`Unable to insert Portal App HTML into areaId: ${appAreaId}`, e);
           }
       }
    });

    return {
        resultHtml,
        serverSideRenderedApps,
        embeddedPortalPageApps,
    };
};

const renderToString = (template: string, templateMustExist: boolean, setupTheme: () => void, model: any, fallback: () => string, res: Response, logger: MashroomLogger): Promise<string> => {
    return new Promise((resolve) => {
        setupTheme();
        res.render(template, model, (error, html) => {
            if (error) {
                if (templateMustExist || error.message.indexOf('Failed to lookup view') === -1) {
                    logger.error(`Theme template '${template}' not found or invalid`, error);
                } else {
                    logger.debug(`No theme template '${template}' found`);
                }
                resolve(fallback());
            } else {
                resolve(html);
            }
        });
    });
};

const getSafePluginName = (pluginName: string) => pluginName.toLowerCase().replace(/ /g, '-');
