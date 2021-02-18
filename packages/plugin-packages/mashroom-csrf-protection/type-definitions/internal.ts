
import type {RequestHandler} from 'express';

export interface MashroomCSRFMiddleware {
    middleware(): RequestHandler
}
