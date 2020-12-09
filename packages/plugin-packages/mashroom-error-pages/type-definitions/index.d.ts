import type {ExpressMiddleware} from '@mashroom/mashroom/type-definitions';

export type HtmlPage = string;

export type ErrorMappingI18NEntry = {
    [lang: string]: HtmlPage;
}

export type ErrorMapping = {
    [statusCode: string]: ErrorMappingI18NEntry | HtmlPage;
}

export interface MashroomErrorPagesMiddleware {
    middleware(): ExpressMiddleware
}
