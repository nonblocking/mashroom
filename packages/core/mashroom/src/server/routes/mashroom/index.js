// @flow

import {Router} from 'express';
import admin from './admin';
import health from './health';

import type {ExpressRequest, ExpressResponse} from '../../../../type-definitions';

const router = new Router<ExpressRequest, ExpressResponse>();

router.get('/', (req: ExpressRequest, res: ExpressResponse) => {
    // Forward to Admin UI
    res.redirect('/mashroom/admin');
});

router.use('/admin', admin);
router.use('/health', health);

export default router;
