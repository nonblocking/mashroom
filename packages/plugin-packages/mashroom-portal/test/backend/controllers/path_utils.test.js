// @flow

import {getSiteAndFriendlyUrl} from '../../../src/backend/utils/path_utils';

describe('path_utils', () => {

    it('resolves site path and friendly URL', () => {
        const req1: any = {
            path: '/foo/bar/x',
        };
        const req2: any = {
            path: '/foo',
        };
        const req3: any = {
            path: '/foo/',
        };
        const req4: any = {
            path: '/',
        };
        const req5: any = {
        };

        expect(getSiteAndFriendlyUrl(req1)).toEqual({
            sitePath: '/foo',
            friendlyUrl: '/bar/x',
        });
        expect(getSiteAndFriendlyUrl(req2)).toEqual({
            sitePath: '/foo',
            friendlyUrl: '/',
        });
        expect(getSiteAndFriendlyUrl(req3)).toEqual({
            sitePath: '/foo',
            friendlyUrl: '/',
        });
        expect(getSiteAndFriendlyUrl(req4)).toEqual({
            sitePath: null,
            friendlyUrl: null,
        });
        expect(getSiteAndFriendlyUrl(req5)).toEqual({
            sitePath: null,
            friendlyUrl: null,
        });
    });
});
