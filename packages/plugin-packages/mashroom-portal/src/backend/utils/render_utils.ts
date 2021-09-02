import {PORTAL_PAGE_TEMPLATE_NAME, PORTAL_APP_WRAPPER_TEMPLATE_NAME, PORTAL_APP_ERROR_TEMPLATE_NAME} from '../constants';
import minimalTemplatePortal from '../theme/minimal_template_portal';
import defaultTemplateAppWrapper from '../theme/default_template_app_wrapper';
import defaultTemplateAppError from '../theme/default_template_app_error';

import type {Request, Response} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomPortalPageRenderModel} from '../../../type-definitions';
import {MashroomPortalAppErrorRenderModel, MashroomPortalAppWrapperRenderModel} from '../../../type-definitions';

export const renderPage = async (themeExists: boolean, model: MashroomPortalPageRenderModel, req: Request, res: Response, logger: MashroomLogger): Promise<string> => {
    const fallback = () => minimalTemplatePortal(model);

    if (themeExists) {
        return renderToString(PORTAL_PAGE_TEMPLATE_NAME, true, model, fallback, res, logger);
    }

    return fallback();
}

export const renderAppWrapper = async (themeExists: boolean, model: MashroomPortalAppWrapperRenderModel, req: Request, res: Response, logger: MashroomLogger): Promise<string> => {
    const fallback = () => defaultTemplateAppWrapper(model);

    if (themeExists) {
        return renderToString(PORTAL_APP_WRAPPER_TEMPLATE_NAME, false, model, fallback, res, logger);
    }

    return fallback();
}

export const renderAppWrapperToClientTemplate = async (themeExists: boolean, messages: (key: string) => string, req: Request, res: Response, logger: MashroomLogger): Promise<string> => {
    const model: MashroomPortalAppWrapperRenderModel = {
        appId: '__APP_ID__',
        pluginName: '__PLUGIN_NAME__',
        safePluginName: '__SAFE_PLUGIN_NAME__',
        title: '__TITLE__',
        messages,
        appSSRHtml: null,
    }
    return renderAppWrapper(themeExists, model, req, res, logger);
}

export const renderAppError = async (themeExists: boolean, model: MashroomPortalAppErrorRenderModel, req: Request, res: Response, logger: MashroomLogger): Promise<string> => {
    const fallback = () => defaultTemplateAppError(model);

    if (themeExists) {
        return renderToString(PORTAL_APP_ERROR_TEMPLATE_NAME, false, model, fallback, res, logger);
    }

    return fallback();
}

export const renderAppErrorToClientTemplate = async (themeExists: boolean, messages: (key: string) => string, req: Request, res: Response, logger: MashroomLogger): Promise<string> => {

    const model: MashroomPortalAppErrorRenderModel = {
        appId: '__APP_ID__',
        pluginName: '__PLUGIN_NAME__',
        safePluginName: '__SAFE_PLUGIN_NAME__',
        title: '__TITLE__',
        errorMessage: null,
        messages,
    }
    return renderAppError(themeExists, model, req, res, logger);
}

const renderToString = (template: string, templateMustExist: boolean, model: any, fallback: () => string, res: Response, logger: MashroomLogger): Promise<string> => {
    return new Promise((resolve) => {
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
    })
}
