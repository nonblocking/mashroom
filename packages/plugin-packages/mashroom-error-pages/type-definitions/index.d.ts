import type {ExpressMiddleware} from '@mashroom/mashroom/type-definitions';

export type ErrorMapping = {
    [statusCode: string]: string | undefined | null;
}

export interface MashroomErrorPagesMiddleware {
    middleware(): ExpressMiddleware
}
