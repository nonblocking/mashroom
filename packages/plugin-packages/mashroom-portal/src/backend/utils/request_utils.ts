
import type {ExpressRequest} from '@mashroom/mashroom/type-definitions';

export const isAjaxRequest = (req: ExpressRequest): boolean => {
    return req.xhr || (/json/i).test(req.headers.accept as string);
};
