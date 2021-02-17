
import {ready} from './checks';

import type {Request, Response} from 'express';

const readyRoute = (req: Request, res: Response) => {
    if (ready(req)) {
        res.end();
    } else {
        res.sendStatus(503);
    }
};

export default readyRoute;
