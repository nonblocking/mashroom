
import {ready} from './checks';

import type {Request, Response} from 'express';

const readyRoute = async (req: Request, res: Response) => {
    const checkResponse = await ready(req);
    if (checkResponse.ok) {
        res.end();
    } else {
        res.status(503);
        res.type('json');
        res.json({
            errors: checkResponse.errors,
        });
    }
};

export default readyRoute;
