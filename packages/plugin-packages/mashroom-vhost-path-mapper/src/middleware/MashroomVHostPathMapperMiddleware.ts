
import determineHost from './determine_host';
import findHostDefinition from './find_host_definition';
import mapPath from './map_path';
import {VHOST_MAPPING_INFO_REQUEST_PROP_NAME} from '../constants';

import type {Request, Response, NextFunction} from 'express';
import type {
    MashroomLogger
} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomVHostPathMapperMiddleware as MashroomVHostPathMapperMiddlewareType,
    VHostDefinitions
} from '../../type-definitions/internal';

export default class MashroomVHostPathMapperMiddleware implements MashroomVHostPathMapperMiddlewareType {

    constructor(private _considerHttpHeaders: Array<string>, private _vhostDefinitions: VHostDefinitions) {
    }

    middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            const logger: MashroomLogger = req.pluginContext.loggerFactory('mashroom.vhost.pathmapper');

            try {
                const host = determineHost(this._considerHttpHeaders, req);
                // logger.debug('Determined host', host);

                const hostDefinition = findHostDefinition(host, this._vhostDefinitions);
                if (hostDefinition) {
                    const originalPath = req.url;
                    const mappingResult = mapPath(originalPath, hostDefinition);
                    if (mappingResult) {
                        req.url = mappingResult.url;
                        req.originalUrl = mappingResult.url;
                        // @ts-ignore
                        req[VHOST_MAPPING_INFO_REQUEST_PROP_NAME] = mappingResult.info;
                        logger.debug(`Path has been mapped: ${originalPath} -> ${mappingResult.url}`);
                    }

                    // Intercept redirects and map them
                    const originalLocationFn = res.location.bind(res);
                    // @ts-ignore
                    res.location = (redirectUrl: string) => {
                        let newRedirectUrl = redirectUrl;
                        const redirectMappingResult = mapPath(redirectUrl, hostDefinition, true);
                        if (redirectMappingResult) {
                            newRedirectUrl = redirectMappingResult.url || '/';
                            logger.debug(`Redirect location has been mapped: ${redirectUrl} -> ${redirectMappingResult.url}`);
                        }
                        return originalLocationFn(newRedirectUrl);
                    };
                }

                next();

            } catch (error) {
                logger.error('Virtual host path mapping failed', error);
                res.sendStatus(500);
            }
        };
    }

}
