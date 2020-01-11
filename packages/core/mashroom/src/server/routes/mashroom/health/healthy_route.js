// @flow

import {healthy} from './checks';

import type {ExpressRequest, ExpressResponse} from '../../../../../type-definitions';

const healthyRoute = (req: ExpressRequest, res: ExpressResponse) => {
    if (healthy(req)) {
        res.end();
    } else {
        res.sendStatus(503);
    }
};

export default healthyRoute;
