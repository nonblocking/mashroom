
import {PORTAL_PAGE_TEMPLATE_NAME, PORTAL_APP_WRAPPER_TEMPLATE_NAME, PORTAL_APP_ERROR_TEMPLATE_NAME} from '../constants';
import minimalTemplatePortal from '../theme/minimal_template_portal';
import defaultTemplateAppWrapper from '../theme/default_template_app_wrapper';
import defaultTemplateAppError from '../theme/default_template_app_error';
import {renderServerSide} from './ssr_utils';

import type {Request, Response} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalPageRenderModel, MashroomPortalAppErrorRenderModel, MashroomPortalAppWrapperRenderModel} from '../../../type-definitions';
import type {MashroomPortalPageApps, MashroomPortalPageContentRenderResult} from '../../../type-definitions/internal';

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

export const renderPageContent = async (portalLayout: string, portalPageApps: MashroomPortalPageApps, themeExists: boolean, setupTheme: () => void, messages: (key: string) => string, req: Request, res: Response, logger: MashroomLogger): Promise<MashroomPortalPageContentRenderResult> => {
    const serverSideRenderedApps: Array<string> = [];
    const appAreas = Object.keys(portalPageApps);
    const promises: Array<Promise<Array<string>>> = [];

    let pageContent = portalLayout;
    for (const appAreaId of appAreas) {
        promises.push(
            Promise.all(
                portalPageApps[appAreaId].map(async ({pluginName, appSetup}) => {
                    const {appId, title} = appSetup;

                    const appSSRHtml = await renderServerSide(pluginName, appSetup, req, logger);
                    if (appSSRHtml && serverSideRenderedApps.indexOf(pluginName) === -1) {
                        serverSideRenderedApps.push(pluginName);
                    }

                    const model: MashroomPortalAppWrapperRenderModel = {
                        appId,
                        pluginName,
                        safePluginName: getSafePluginName(pluginName),
                        title: title || pluginName,
                        messages,
                        appSSRHtml,
                    };
                    return renderAppWrapper(themeExists, setupTheme, model, req, res, logger);
                })
            ).then(
                (result) => result,
                (error) => {
                    logger.error(`Rendering apps in appArea '${appAreaId}' failed`, error);
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
           const startIdxArea = pageContent.search(`<[a-zA-Z]+.*id=["']${appAreaId}["']`);
           const beginAreaContent = pageContent.indexOf('>', startIdxArea) + 1;
           pageContent = [pageContent.slice(0, beginAreaContent), appHtml, pageContent.slice(beginAreaContent)].join('');
       }
    });

    return {
        pageContent,
        serverSideRenderedApps,
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
