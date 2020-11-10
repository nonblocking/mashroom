// @flow

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomMessageTopicACLChecker from '../src/services/MashroomMessageTopicACLChecker';

import type {MashroomSecurityUser} from '@mashroom/mashroom-security/type-definitions';

describe('MashroomMessageTopicACLChecker', () => {

    it('accepts the access when no rule defined', async () => {
        const aclPath = './test_acl.json';
        const aclChecker = new MashroomMessageTopicACLChecker(aclPath, __dirname, dummyLoggerFactory);

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            email: null,
            pictureUrl: null,
            roles: Object.freeze(['Role55']),
            secrets: null,
            extraData: null,
        };

        expect(aclChecker.allowed('x/y/z', user)).toBeTruthy();
    });

    it('should accept a topic with the required role', async () => {
        const aclPath = './test_acl.json';
        const aclChecker = new MashroomMessageTopicACLChecker(aclPath, __dirname, dummyLoggerFactory);

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            email: null,
            pictureUrl: null,
            roles: Object.freeze(['GroupX', 'Role5']),
            secrets: null,
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
            secrets: null,
            extraData: null,
        };

        expect(aclChecker.allowed('foo/bar/2', user)).toBeFalsy();
    });

    it('should accept a topic when the user has no denied role', async () => {
        const aclPath = './test_acl.json';
        const aclChecker = new MashroomMessageTopicACLChecker(aclPath, __dirname, dummyLoggerFactory);

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            email: null,
            pictureUrl: null,
            roles: Object.freeze(['Role1', 'Role6']),
            secrets: null,
            extraData: null,
        };

        expect(aclChecker.allowed('my/topic', user)).toBeTruthy();
    });

    it('should not accept a topic when the user a denied role', async () => {
        const aclPath = './test_acl.json';
        const aclChecker = new MashroomMessageTopicACLChecker(aclPath, __dirname, dummyLoggerFactory);

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            email: null,
            pictureUrl: null,
            roles: Object.freeze(['Role1', 'Role5']),
            secrets: null,
            extraData: null,
        };

        expect(aclChecker.allowed('my/topic', user)).toBeFalsy();
    });

    it('supports single and multi level placeholder', async () => {
        const aclPath = './test_acl.json';
        const aclChecker = new MashroomMessageTopicACLChecker(aclPath, __dirname, dummyLoggerFactory);

        const user: MashroomSecurityUser = {
            username: 'test',
            displayName: 'Test',
            email: null,
            pictureUrl: null,
            roles: Object.freeze(['Role55']),
            secrets: null,
            extraData: null,
        };

        expect(aclChecker.allowed('a/b/c/d/e', user)).toBeFalsy();
    });

});
