// @flow

import {up} from './checks';

import type {ExpressRequest, ExpressResponse} from '../../../../../type-definitions';

const upRoute = (req: ExpressRequest, res: ExpressResponse) => {
    if (up(req)) {
        res.end();
    } else {
        res.sendStatus(503);
    }
};

export default upRoute;
