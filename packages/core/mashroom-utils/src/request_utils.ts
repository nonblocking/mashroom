
import type {Request} from 'express';

const STATIC_RESOURCE_EXTENSIONS = [
    'jpg', 'jpeg', 'gif', 'png', 'avif', 'webp', 'svg', 'ico',
    'ttf', 'woff', 'woff2', 'eot', 'otf',
    'css', 'js',
    'xml', 'rss', 'txt'
];

export const isAjaxRequest = (req: Request): boolean => {
    return req.xhr || (/json/i).test(req.headers.accept as string);
};

export const isHtmlRequest = (req: Request): boolean => {
    return (req.method === 'GET' || req.method === 'POST') && !req.xhr && (/html/i).test(req.headers.accept as string);
};

export const isStaticResourceRequest = (req: Request): boolean => {
    if (req.method !== 'GET') {
        return false;
    }
    const segments = req.path.split('/');
    const parts = segments[segments.length - 1].split('.');
    if (parts.length < 2) {
        return false;
    }
    const ext = parts[parts.length - 1];
    return STATIC_RESOURCE_EXTENSIONS.includes(ext);
};

