import {existsSync} from 'fs';
import {resolve, isAbsolute} from 'path';
import {requestUtils, resourceUtils} from '@mashroom/mashroom-utils';
import {PLACEHOLDER_REQUEST_URL, PLACEHOLDER_STATUS_CODE, PLACEHOLDER_MASHROOM_VERSION, PLACEHOLDER_I18N_MESSAGE} from './constants';
import type {Request, Response, NextFunction, RequestHandler} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {
    MashroomErrorPagesMiddleware as MashroomErrorPagesMiddlewareType,
    ErrorMapping,
} from '../type-definitions';

const FILE_MAPPING: Record<string, string> = {};
const DEFAULT_FETCH_TIMEOUT_MS = 3000;

const isNotJsonResponse = (res: Response) => (/json/i).test(res.getHeader('content-type') as string || '');

export default class MashroomErrorPagesMiddleware implements MashroomErrorPagesMiddlewareType {

    private _pluginRootFolder: string;

    constructor(private _serverRootFolder: string, private _serverVersion: string, private _mapping: ErrorMapping) {
        this._pluginRootFolder = resolve(__dirname, '..');
    }

    middleware(): RequestHandler {
        return (req: Request, res: Response, next: NextFunction) => {
            // Ignore non-html requests
            if (!requestUtils.isHtmlRequest(req)) {
                next();
                return;
            }

            const originalWrite = res.write;
            const originalEnd = res.end;
            let errorChecked = false;
            let errorPageSendPending = false;
            let errorPageSent = false;
            let writeBuffer: Array<() => void> = [];

            const doWrite = (args: Array<any>, exec: () => void) => {
                if (res.statusCode >= 400 && !errorChecked && !isNotJsonResponse(res)) {
                    errorChecked = true;
                    errorPageSendPending = true;

                    let cbArg: () => void | undefined;
                    if (args.length > 0) {
                        const lastArg = [...args].pop();
                        if (typeof lastArg === 'function') {
                            cbArg = lastArg;
                        }
                    }

                    this.getErrorPageHTML(req, res).then((html) => {
                        if (html) {
                            errorPageSendPending = false;
                            errorPageSent = true;
                            res.removeHeader('content-security-policy');
                            res.setHeader('content-length', html.length);
                            res.setHeader('content-type', 'text/html');
                            originalEnd.call(res, html, 'utf-8', cbArg);
                        } else {
                            errorPageSendPending = false;
                            exec();
                            writeBuffer.forEach((w) => w());
                            writeBuffer = [];
                        }
                    });
                } else {
                    if (errorPageSent) {
                        // Don't send anything else
                    } else if (errorPageSendPending) {
                        // Put to a buffer until we know if the error page can be sent or not
                        writeBuffer.push(exec);
                    } else {
                        // Default: Execute immediately
                        exec();
                    }
                }
            };

            res.write = (...args: any) => {
                doWrite(args, () => {
                    originalWrite.apply(res, args);
                });
                return true;
            };
            res.end = (...args: any): any => {
                doWrite(args, () => {
                    originalEnd.apply(res, args);
                });
            };

            next();
        };
    }

    private async getErrorPageHTML(req: Request, res: Response): Promise<string | null> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.errorPages');

        const statusCode = res.statusCode;
        let errorPageUri = this._mapping[String(statusCode)];

        if (!errorPageUri) {
            errorPageUri = this._mapping.default;
        }

        if (!errorPageUri) {
            return null;
        }

        let fixedErrorPageUri;
        const localFile = !errorPageUri.includes('://') || errorPageUri.startsWith('file:/');
        if (localFile) {
            let htmlFile = FILE_MAPPING[errorPageUri];
            if (!htmlFile) {
                if (!errorPageUri.startsWith('file:/')) {
                    if (!isAbsolute(errorPageUri)) {
                        if (existsSync(resolve(this._serverRootFolder, errorPageUri))) {
                            htmlFile = resolve(this._serverRootFolder, errorPageUri);
                        } else if (existsSync(resolve(this._pluginRootFolder, errorPageUri))) {
                            htmlFile = resolve(this._pluginRootFolder, errorPageUri);
                        } else {
                            logger.warn(`Error page not found: ${errorPageUri}`);
                            return null;
                        }
                    }
                    if (htmlFile.startsWith('/')) {
                        fixedErrorPageUri = `file://${htmlFile}`;
                    } else {
                        fixedErrorPageUri = `file:///${htmlFile}`;
                    }
                } else {
                    fixedErrorPageUri = errorPageUri;
                }
                FILE_MAPPING[errorPageUri] = fixedErrorPageUri;
            } else {
                fixedErrorPageUri = htmlFile;
            }
        } else {
            fixedErrorPageUri = errorPageUri;
        }

        const abortController = new AbortController();
        // Fetching the error page should not take longer than a few seconds
        const abortTimeout = setTimeout(() => abortController.abort(), DEFAULT_FETCH_TIMEOUT_MS);
        try {
            logger.debug(`Loading error page ${fixedErrorPageUri} for HTTP status ${res.statusCode}`);
            const html = await resourceUtils.getResourceAsString(fixedErrorPageUri, {
                abortSignal: abortController.signal,
            });
            return this._replacePlaceholders(html, req, res);
        } catch (e) {
            logger.error(`Loading error page ${errorPageUri} failed`, e);
        } finally {
            clearTimeout(abortTimeout);
        }

        return null;
    }

    private _replacePlaceholders(html: string, req: Request, res: Response): string {
        const i18nService: MashroomI18NService | undefined = req.pluginContext.services.i18n?.service;
        const lang = i18nService?.getLanguage(req) || 'en';

        return html
            .replace(PLACEHOLDER_REQUEST_URL, encodeURI(req.originalUrl))
            .replace(PLACEHOLDER_STATUS_CODE, String(res.statusCode))
            .replace(PLACEHOLDER_MASHROOM_VERSION, this._serverVersion)
            .replace(PLACEHOLDER_I18N_MESSAGE, (substring, messageKeyAndDefault) => {
                const [messageKey, defaultMessage] = messageKeyAndDefault?.split(',') || {};
                const message = i18nService?.getMessage(messageKey, lang);
                if (!message || message === messageKey) {
                    return defaultMessage || '';
                }
                return message;
            });
    }

}
