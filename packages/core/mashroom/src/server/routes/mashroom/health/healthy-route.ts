
import {healthy} from './checks';

import type {Request, Response} from 'express';

const healthyRoute = async (req: Request, res: Response) => {
    const checkResult = await healthy(req);
    if (checkResult.ok) {
        res.end();
    } else {
        if (req.pluginContext) {
            const logger = req.pluginContext.loggerFactory('mashroom.health');
            logger.warn('Server unhealthy:', checkResult.errors);
        } else {
            console.warn('Server unhealthy:', checkResult.errors);
        }
        res.status(503);
        res.type('json');
        res.json({
            errors: checkResult.errors,
        });
    }
};

export default healthyRoute;
