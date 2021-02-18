
import type {Request, Response} from 'express';

export default (req: Request, res: Response) => {
    res.redirect(`${req.baseUrl  }/admin`);
};
