
import querystring from 'querystring';
import {getDefaultSite} from '../utils/model_utils';
import {getPortalPath} from '../utils/path_utils';

import type {Request, Response} from 'express';
import type {ExpressRequest, MashroomLogger} from '@mashroom/mashroom/type-definitions';

export default class IndexController {

    async index(req: Request, res: Response): Promise<void> {
        const reqWithContext = req as ExpressRequest;
        const logger: MashroomLogger = reqWithContext.pluginContext.loggerFactory('mashroom.portal');

        try {
            const portalPath = getPortalPath();
            const defaultSite = await getDefaultSite(reqWithContext, logger);
            if (defaultSite) {
                logger.debug(`Redirecting to default site: ${defaultSite.siteId}`);
                const query = querystring.stringify(req.query as any);
                res.redirect(portalPath + defaultSite.path + (query ? `?${query}` : ''));
            } else {
                res.sendStatus(404);
            }

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }


}
