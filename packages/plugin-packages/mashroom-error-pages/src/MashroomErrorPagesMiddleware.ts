import {existsSync} from 'fs';
import {resolve, isAbsolute} from 'path';
import {promisify} from 'util';
import getUriCbStyle from 'get-uri';
// @ts-ignore
import {isHtmlRequest} from '@mashroom/mashroom-utils/lib/request_utils';
import {PLACEHOLDER_REQUEST_URL, PLACEHOLDER_STATUS_CODE, PLACEHOLDER_MASHROOM_VERSION, PLACEHOLDER_I18N_MESSAGE} from './constants';
import type {Readable} from 'stream';
import type {MashroomLogger, ExpressRequest, ExpressResponse, ExpressNextFunction, ExpressMiddleware} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {
    MashroomErrorPagesMiddleware as MashroomErrorPagesMiddlewareType,
    ErrorMapping,
} from '../type-definitions';

const getUri = promisify(getUriCbStyle);

const FILE_MAPPING: Record<string, string> = {};

export default class MashroomErrorPagesMiddleware implements MashroomErrorPagesMiddlewareType {

    private pluginRooterFolder: string;

    constructor(private serverRootFolder: string, private serverVersion: string, private mapping: ErrorMapping) {
        this.pluginRooterFolder = resolve(__dirname, '..');
    }

    middleware(): ExpressMiddleware {
        return (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
            const originalWrite = res.write;
            const originalEnd = res.end;
            let errorChecked = false;
            let errorPageSendPending = false;
            let errorPageSent = false;
            let writeBuffer: Array<() => void> = [];

            const doWrite = (args: Array<any>, exec: () => void) => {
                if (res.statusCode >= 400 && !errorChecked && isHtmlRequest(req)) {
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
            }

            res.write = (...args: any) => {
                doWrite(args, () => {
                    originalWrite.apply(res, args);
                });
                return true;
            };
            res.end = (...args: any) => {
                doWrite(args, () => {
                    originalEnd.apply(res, args);
                });
            };

            next();
        };
    }

    private async getErrorPageHTML(req: ExpressRequest, res: ExpressResponse): Promise<string | null> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.errorPages');

        const statusCode = res.statusCode;
        let errorPageUri = this.mapping[String(statusCode)];

        if (!errorPageUri) {
            errorPageUri = this.mapping.default;
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
                        if (existsSync(resolve(this.serverRootFolder, errorPageUri))) {
                            htmlFile = resolve(this.serverRootFolder, errorPageUri);
                        } else if (existsSync(resolve(this.pluginRooterFolder, errorPageUri))) {
                            htmlFile = resolve(this.pluginRooterFolder, errorPageUri);
                        } else {
                            logger.warn(`Error page not found: ${errorPageUri}`);
                            return null;
                        }
                    }
                    fixedErrorPageUri = `file://${htmlFile}`;
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

        try {
            logger.debug(`Loading error page ${fixedErrorPageUri} for HTTP status ${res.statusCode}`);
            const html = await this.getResourceAsString(fixedErrorPageUri);
            return this.replacePlaceholders(html, req, res);
        } catch (e) {
            logger.error(`Loading error page ${errorPageUri} failed`, e);
        }

        return null;
    }

    private replacePlaceholders(html: string, req: ExpressRequest, res: ExpressResponse): string {
        const i18nService: MashroomI18NService | undefined = req.pluginContext.services.i18n?.service;
        const lang = i18nService?.getLanguage(req) || 'en';

        return html
            .replace(PLACEHOLDER_REQUEST_URL, req.originalUrl)
            .replace(PLACEHOLDER_STATUS_CODE, String(res.statusCode))
            .replace(PLACEHOLDER_MASHROOM_VERSION, this.serverVersion)
            .replace(PLACEHOLDER_I18N_MESSAGE, (substring, key) => {
                return i18nService?.getMessage(key, lang) || '???';
            });
    }

    private async getResourceAsString(errorPageUri: string): Promise<string> {
        const stream = await getUri(errorPageUri) as Readable;
        return new Promise((resolve, reject) => {
            const chunks: Array<Uint8Array> = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', (error) => reject(error));
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        })
    }

}
