
import {ready} from './checks';

import type {Request, Response} from 'express';

const readyRoute = async (req: Request, res: Response) => {
    const checkResponse = await ready(req);
    if (checkResponse.ok) {
        res.end();
    } else {
        if (req.pluginContext) {
            const logger = req.pluginContext.loggerFactory('mashroom.health');
            logger.warn('Server not ready (yet):', checkResponse.errors);
        } else {
            console.warn('Server not ready (yet):', checkResponse.errors);
        }
        res.status(503);
        res.type('json');
        res.json({
            errors: checkResponse.errors,
        });
    }
};

export default readyRoute;
