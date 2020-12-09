import {resolve, isAbsolute} from 'path';
import {promisify} from 'util';
import getUriCbStyle from 'get-uri';
// @ts-ignore
import {isAjaxRequest} from '@mashroom/mashroom-utils/lib/request_utils';
import type {ReadStream} from 'fs';
import type {MashroomLogger, ExpressRequest, ExpressResponse, ExpressNextFunction} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {
    MashroomErrorPagesMiddleware as MashroomErrorPagesMiddlewareType,
    ErrorMapping,
    ErrorMappingI18NEntry
} from '../type-definitions';

const getUri = promisify(getUriCbStyle);

export default class MashroomErrorPagesMiddleware implements MashroomErrorPagesMiddlewareType {

    private pluginRooterFolder: string;

    constructor(private serverRootFolder: string, private mapping: ErrorMapping) {
        this.pluginRooterFolder = resolve(__dirname, '..');
    }

    middleware() {
        return (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
            let processed = false;
            const originalSend = res.send;
            const originalEnd = res.end;

            res.send = (...args) => {
                if (res.statusCode >= 400 && !processed && !isAjaxRequest(req)) {
                    processed = true;
                    this.getErrorPageHTML(req, res).then((stream) => {
                        if (stream) {
                            res.type('text/html');
                            originalSend.call(res, stream);
                        } else {
                            originalSend.apply(res, args);
                        }
                    });
                } else {
                    originalSend.apply(res, args);
                }
                return res;
            };
            res.end = (...args: any) => {
                if (res.statusCode >= 400 && !processed && !isAjaxRequest(req) && !res.headersSent) {
                    processed = true;
                    this.getErrorPageHTML(req, res).then((stream) => {
                        if (stream) {
                            res.type('text/html');
                            originalSend.call(res, stream);
                        } else {
                            originalEnd.apply(res, args);
                        }
                    });
                } else {
                    originalEnd.apply(res, args);
                }
                return res;
            };

            next();
        };
    }

    private async getErrorPageHTML(req: ExpressRequest, res: ExpressResponse): Promise<ReadStream | null> {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.errorPages');
        const i18nService: MashroomI18NService | undefined = req.pluginContext.services.i18n?.service;

        const statusCode = res.statusCode;
        const entry = this.mapping[String(statusCode)];
        let targetHTML;
        if (typeof (entry) === 'string') {
            targetHTML = entry;
        } else {
            const lang = i18nService?.getLanguage(req);
            const handlers = entry as ErrorMappingI18NEntry;
            targetHTML = (lang && handlers[lang]) || handlers.default;
        }

        if (!targetHTML) {
            return null;
        }

        // TODO

        return null;
    }
}
