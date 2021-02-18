import type {RequestHandler} from 'express';

export type ErrorMapping = {
    [statusCode: string]: string | undefined | null;
}

export interface MashroomErrorPagesMiddleware {
    middleware(): RequestHandler
}
