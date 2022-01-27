
import {ready} from './checks';

import type {Request, Response} from 'express';

const readyRoute = async (req: Request, res: Response) => {
    const checkResponse = await ready(req);
    if (checkResponse.ok) {
        res.end();
    } else {
        res.status(503);
        res.json({
            errors: req.messages,
        });
    }
};

export default readyRoute;
