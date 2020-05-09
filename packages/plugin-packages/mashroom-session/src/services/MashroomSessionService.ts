
import {getSessionCount, clearSessions} from '../middleware/MashroomSessionMiddleware';

import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';
import type {MashroomSessionService as MashroomSessionServiceType} from '../../type-definitions';

export default class MashroomSessionService implements MashroomSessionServiceType {

    async getSessionCount(req: ExpressRequest): Promise<number | null | undefined> {
        const logger = req.pluginContext.loggerFactory('mashroom.session.service');
        try {
            return getSessionCount();
        } catch (e) {
            logger.error('Could not determine session count', e);
        }
        return null;
    }

    async clearSessions(req: ExpressRequest): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.session.service');
        try {
            await clearSessions();
        } catch (e) {
            logger.error('Could not clear session', e);
        }
    }

}
