
import {isHtmlRequest, isAjaxRequest, isStaticResourceRequest} from '../src/request_utils';

describe('request_utils.isHtmlRequest', () => {

    it('checks the accept header', () => {
        const req1: any = {
            method: 'GET',
            headers: {
            }
        };
        const req2: any = {
            method: 'GET',
            headers: {
                accept: 'text/html',
            },
        };

        expect(isHtmlRequest(req1)).toBeFalsy();
        expect(isHtmlRequest(req2)).toBeTruthy();
    });
});

describe('request_utils.isAjaxRequest', () => {

    it('checks the accept header', () => {
        const req1: any = {
            method: 'GET',
            headers: {
            }
        };
        const req2: any = {
            method: 'GET',
            headers: {
                accept: 'application/json',
            },
        };

        expect(isAjaxRequest(req1)).toBeFalsy();
        expect(isAjaxRequest(req2)).toBeTruthy();
    });
});

describe('request_utils.isStaticResourceRequest', () => {

    it('checks the extension', () => {
        const req1: any = {
            method: 'GET',
            path: '/foo/bar',
        };
        const req2: any = {
            method: 'GET',
            path: '/foo/bar.css',
        };
        const req3: any = {
            method: 'GET',
            path: '/foo/bar.woff2',
        };

        expect(isStaticResourceRequest(req1)).toBeFalsy();
        expect(isStaticResourceRequest(req2)).toBeTruthy();
        expect(isStaticResourceRequest(req3)).toBeTruthy();
    });
});
