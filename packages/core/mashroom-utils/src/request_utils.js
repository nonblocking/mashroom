// @flow

import type {$Request} from 'express';

export const isAjaxRequest = (req: $Request): boolean => {
    return req.xhr || (/json/i).test(req.headers.accept);
};

export const isHtmlRequest = (req: $Request): boolean => {
    return !req.xhr && (/html/i).test(req.headers.accept);
};
