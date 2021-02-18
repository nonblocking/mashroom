
import {Router} from 'express';
import admin from './admin';
import health from './health';

import type {Request, Response} from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
    // Forward to Admin UI
    res.redirect('/mashroom/admin');
});

router.use('/admin', admin);
router.use('/health', health);

export default router;
