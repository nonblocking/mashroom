// @flow

import {ready} from './checks';

import type {ExpressRequest, ExpressResponse} from '../../../../../type-definitions';

const readyRoute = (req: ExpressRequest, res: ExpressResponse) => {
    if (ready(req)) {
        res.end();
    } else {
        res.sendStatus(503);
    }
};

export default readyRoute;
