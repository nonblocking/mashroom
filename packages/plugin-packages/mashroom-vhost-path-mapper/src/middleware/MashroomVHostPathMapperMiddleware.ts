
import {URL} from 'url';
import context from '../context';
import determineHost from '../utils/determine-host';
import findHostDefinition from '../utils/find-host-definition';
import mapPath from '../utils/map-path';
import {VHOST_MAPPING_INFO_REQUEST_PROP_NAME} from '../constants';

import type {Request, Response, NextFunction} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';
import type {MashroomVHostPathMapperMiddleware as MashroomVHostPathMapperMiddlewareType} from '../../type-definitions/internal';

export default class MashroomVHostPathMapperMiddleware implements MashroomVHostPathMapperMiddlewareType {

    middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.vhost.pathmapper');

            try {
                const host = determineHost(req, context.considerHttpHeaders);
                // logger.debug('Determined host', host);

                const hostDefinition = findHostDefinition(host, context.vhostDefinitions);
                if (hostDefinition) {
                    const originalPath = req.url;
                    const mappingResult = mapPath(originalPath, hostDefinition);
                    if (mappingResult) {
                        req.url = mappingResult.url;
                        req.originalUrl = mappingResult.url;
                        req[VHOST_MAPPING_INFO_REQUEST_PROP_NAME] = mappingResult.info;
                        logger.debug(`Path has been mapped: ${originalPath} -> ${mappingResult.url}`);
                    }

                    // Intercept redirects and map them
                    if (res.location) {
                        const originalLocationFn = res.location.bind(res);
                        res.location = (redirectUrl: string) => {
                            let fixedRedirectUrl = redirectUrl;
                            let redirectPath: string | undefined;
                            // Absolute URL
                            if (!redirectUrl.startsWith('/')) {
                                try {
                                    const url = new URL(redirectUrl);
                                    if (url.hostname === host.hostname && ((!host.port && !url.port) || url.port === host.port)) {
                                        // Remove host and protocol if this is the frontend host (otherwise the protocol might not match)
                                        fixedRedirectUrl = url.pathname + url.search;
                                        redirectPath = fixedRedirectUrl;
                                    }
                                } catch (e) {
                                    logger.error('Received invalid location header', e);
                                }
                            } else {
                                redirectPath = fixedRedirectUrl;
                            }
                            if (redirectPath) {
                                const redirectMappingResult = mapPath(redirectPath, hostDefinition, true);
                                if (redirectMappingResult) {
                                    fixedRedirectUrl = redirectMappingResult.url || '/';
                                    logger.debug(`Redirect location has been mapped: ${redirectUrl} -> ${fixedRedirectUrl}`);
                                }
                            }
                            return originalLocationFn(fixedRedirectUrl);
                        };
                    }
                }

                next();

            } catch (error) {
                logger.error('Virtual host path mapping failed', error);
                res.sendStatus(500);
            }
        };
    }

}
