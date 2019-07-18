// @flow

import path from 'path';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomSecurityACLChecker from '../src/acl/MashroomSecurityACLChecker';
import type {MashroomSecurityUser} from '../type-definitions';

describe('MashroomSecurityACLChecker', () => {

    it('should not allow anonymous at a protected path', async () => {
        const aclPath = path.resolve(__dirname, './test_acl.json');

        const aclChecker = new MashroomSecurityACLChecker(aclPath, dummyLoggerFactory);
        const user: ?MashroomSecurityUser = null;

        const req: any = {
            path: '/portal',
            method: 'GET',
        };
        expect(await aclChecker.allowed(req, user)).toBeFalsy();

        const req2: any = {
            path: '/portal/foo/bar',
            method: 'GET',
        };
        expect(await aclChecker.allowed(req2, user)).toBeFalsy();

        const req3: any = {
            path: '/portal2',
            method: 'GET',
        };
        expect(await aclChecker.allowed(req3, user)).toBeFalsy();

        const req4: any = {
            path: '/portal2/',
            method: 'GET',
        };
        expect(await aclChecker.allowed(req4, user)).toBeFalsy();

        const req5: any = {
            path: '/a/b/bit/more/complicated',
            method: 'GET',
        };
        expect(await aclChecker.allowed(req5, user)).toBeFalsy();
    });

    it('should allow anonymous at a unprotected path', async () => {
        const aclPath = path.resolve(__dirname, './test_acl.json');

        const aclChecker = new MashroomSecurityACLChecker(aclPath, dummyLoggerFactory);
        const user: ?MashroomSecurityUser = null;

        const req: any = {
            path: '/help/foo/bar',
            method: 'GET',
        };

        expect(await aclChecker.allowed(req, user)).toBeTruthy();

        const req2: any = {
            path: '/a/bit/more/complicated',
            method: 'GET',
        };
        expect(await aclChecker.allowed(req2, user)).toBeTruthy();

        const req3: any = {
            path: '/portal2/foo',
            method: 'GET',
        };
        expect(await aclChecker.allowed(req3, user)).toBeTruthy();


        const req4: any = {
            path: '/portal3',
            method: 'GET',
        };
        expect(await aclChecker.allowed(req4, user)).toBeTruthy();
    });

    it('should allow a user with the required role at a protected path', async () => {
        const aclPath = path.resolve(__dirname, './test_acl.json');

        const aclChecker = new MashroomSecurityACLChecker(aclPath, dummyLoggerFactory);

        const req: any = {
            path: '/portal/foo/bar',
            method: 'GET',
        };

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            roles: Object.freeze(['User'])
        };

        const allowed = await aclChecker.allowed(req, user);

        expect(allowed).toBeTruthy();
    });

    it('should not allow http method when denied for all', async () => {
        const aclPath = path.resolve(__dirname, './test_acl.json');

        const aclChecker = new MashroomSecurityACLChecker(aclPath, dummyLoggerFactory);

        const req: any = {
            path: '/portal/foo/bar',
            method: 'DELETE',
        };

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            roles: Object.freeze(['User'])
        };

        const allowed = await aclChecker.allowed(req, user);

        expect(allowed).toBeFalsy();
    });

    it('should not allow denied role even if the user has an allowed role', async () => {
        const aclPath = path.resolve(__dirname, './test_acl.json');

        const aclChecker = new MashroomSecurityACLChecker(aclPath, dummyLoggerFactory);

        const req: any = {
            path: '/foo/x/bar',
            method: 'GET',
        };

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            roles: Object.freeze(['User', 'Manager'])
        };

        const allowed = await aclChecker.allowed(req, user);

        expect(allowed).toBeFalsy();
    });

});
