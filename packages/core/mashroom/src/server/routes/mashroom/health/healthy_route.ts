
import {healthy} from './checks';

import type {Request, Response} from 'express';

const healthyRoute = (req: Request, res: Response) => {
    if (healthy(req)) {
        res.end();
    } else {
        res.sendStatus(503);
    }
};

export default healthyRoute;
