
import {up} from './checks';

import type {Request, Response} from 'express';

const upRoute = (req: Request, res: Response) => {
    if (up(req)) {
        res.end();
    } else {
        res.sendStatus(503);
    }
};

export default upRoute;
