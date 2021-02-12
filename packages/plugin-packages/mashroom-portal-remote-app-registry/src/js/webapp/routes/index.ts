
import type {ExpressRequest, ExpressResponse} from '@mashroom/mashroom/type-definitions';

export default (req: ExpressRequest, res: ExpressResponse) => {
    res.redirect(`${req.baseUrl  }/admin`);
};
