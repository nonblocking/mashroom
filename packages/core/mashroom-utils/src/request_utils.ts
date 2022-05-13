
import type {Request} from 'express';

export const isAjaxRequest = (req: Request): boolean => {
    return req.xhr || (/json/i).test(req.headers.accept as string);
};

export const isHtmlRequest = (req: Request): boolean => {
    return (req.method === 'GET' || req.method === 'POST') && !req.xhr && (/html/i).test(req.headers.accept as string);
};
