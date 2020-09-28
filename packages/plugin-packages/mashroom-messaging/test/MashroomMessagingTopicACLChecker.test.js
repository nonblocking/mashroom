// @flow

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomMessageTopicACLChecker from '../src/services/MashroomMessageTopicACLChecker';

import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

describe('MashroomMessageTopicACLChecker', () => {

    it('should accept a topic with the required role', async () => {
        const aclPath = './test_acl.json';
        const aclChecker = new MashroomMessageTopicACLChecker(aclPath, __dirname, dummyLoggerFactory);

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            email: null,
            pictureUrl: null,
            roles: Object.freeze(['GroupX', 'Role5']),
            extraData: null,
        };

        expect(aclChecker.allowed('foo/bar/2', user)).toBeTruthy();
    });

    it('should not accept a topic without the required role', async () => {
        const aclPath = './test_acl.json';
        const aclChecker = new MashroomMessageTopicACLChecker(aclPath, __dirname, dummyLoggerFactory);

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            email: null,
            pictureUrl: null,
            roles: Object.freeze(['Role1', 'Role5']),
            extraData: null,
        };

        expect(aclChecker.allowed('foo/bar/2', user)).toBeFalsy();
    });

    it('should not accept a topic when the user a denied role ', async () => {
        const aclPath = './test_acl.json';
        const aclChecker = new MashroomMessageTopicACLChecker(aclPath, __dirname, dummyLoggerFactory);

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            email: null,
            pictureUrl: null,
            roles: Object.freeze(['Role1', 'Role5']),
            extraData: null,
        };

        expect(aclChecker.allowed('my/topic', user)).toBeFalsy();
    });

});
