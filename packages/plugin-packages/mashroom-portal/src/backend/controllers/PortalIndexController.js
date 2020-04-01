// @flow

import {getDefaultSite} from '../utils/model_utils';
import {getPortalPath} from '../utils/path_utils';

import type {ExpressRequest, ExpressResponse, MashroomLogger} from '@mashroom/mashroom/type-definitions';

export default class IndexController {

    async index(req: ExpressRequest, res: ExpressResponse) {
        const logger: MashroomLogger = req.pluginContext.loggerFactory('portal');

        try {
            const portalPath = getPortalPath();
            const defaultSite = await getDefaultSite(req, logger);
            if (defaultSite) {
                logger.debug(`Redirecting to default site: ${defaultSite.siteId}`);
                res.redirect(portalPath + defaultSite.path);
            } else {
                res.sendStatus(404);
            }

        } catch (e) {
            logger.error(e);
            res.sendStatus(500);
        }
    }


}
