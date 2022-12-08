import type {Request} from 'express';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';

export default async (request: Request, logger: MashroomLogger) => {
    await new Promise<void>((resolve) => request.session.save((err: any) => {
        if (err) {
            logger.warn('Saving session failed', err);
        }
        resolve();
    }));
};
