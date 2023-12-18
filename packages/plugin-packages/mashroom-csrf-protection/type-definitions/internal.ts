
import type {RequestHandler} from 'express';

// Session data
declare module 'express-session' {
    interface SessionData {
        __MASHROOM_CSRF_TOKEN?: string;
    }
}

export interface MashroomCSRFMiddleware {
    middleware(): RequestHandler
}
