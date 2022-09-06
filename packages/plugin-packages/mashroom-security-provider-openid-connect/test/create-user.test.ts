
import createUser from '../src/create-user';
import type {IdTokenClaims, UserinfoResponse} from 'openid-client';

describe('create-user', () => {

    it('creates a user from IDToken claims that only contains sub', () => {
        const claims: IdTokenClaims = {
            aud: 'x',
            exp: 0,
            iat: 0,
            iss: 'x',
            sub: 'admin'
        };

        const user = createUser(claims, null, null, undefined, null);

        expect(user).toEqual({
            username: 'admin',
            displayName: 'admin',
            email: undefined,
            pictureUrl: null,
            extraData: null,
            roles: [],
            secrets: null,
        });
    });

    it('creates a user from IDToken claims', () => {
        const claims: IdTokenClaims = {
            aud: 'x',
            exp: 0,
            iat: 0,
            iss: 'x',
            sub: 'x',
            preferred_username: 'admin',
            name: 'Admin User',
            email: 'admin@test.com',
        };

        const user = createUser(claims, null, null, undefined, null);

        expect(user).toEqual({
            username: 'admin',
            displayName: 'Admin User',
            email: 'admin@test.com',
            pictureUrl: null,
            extraData: null,
            roles: [],
            secrets: null,
        });
    });

    it('gets the roles from the IdToken claims', () => {
        const claims: IdTokenClaims = {
            aud: 'x',
            exp: 0,
            iat: 0,
            iss: 'x',
            sub: 'x',
            preferred_username: 'admin',
            name: 'Admin User',
            email: 'admin@test.com',
            roles: ['Role1', 'Role2', 'Role3'],
        };

        const user = createUser(claims, null, 'roles', ['Role2'], null);

        expect(user).toEqual({
            username: 'admin',
            displayName: 'Admin User',
            email: 'admin@test.com',
            pictureUrl: null,
            extraData: null,
            roles: ['Role1', 'Role2', 'Role3', 'Administrator'],
            secrets: null,
        });
    });

    it('creates a user from user info', () => {
        const claims: IdTokenClaims = {
            aud: 'x',
            exp: 0,
            iat: 0,
            iss: 'x',
            sub: 'admin',
        };
        const userInfo: UserinfoResponse = {
            sub: 'admin',
            preferred_username: 'admin',
            name: 'Admin User',
            email: 'admin@test.com',
            picture: 'http://my-picture.com',
            roles: ['Role1', 'Role2', 'Role3'],
        };

        const user = createUser(claims, userInfo, 'roles', ['Role2'], null);

        expect(user).toEqual({
            username: 'admin',
            displayName: 'Admin User',
            email: 'admin@test.com',
            pictureUrl: 'http://my-picture.com',
            extraData: null,
            roles: ['Role1', 'Role2', 'Role3', 'Administrator'],
            secrets: null,
        });
    });

    it('copies extra data from the id token', () => {
        const claims: IdTokenClaims = {
            aud: 'x',
            exp: 0,
            iat: 0,
            iss: 'x',
            sub: 'x',
            preferred_username: 'admin',
            name: 'Admin User',
            email: 'admin@test.com',
            roles: ['Role1', 'Role2', 'Role3'],
            phone: '123123123',
        };

        const user = createUser(claims, undefined, 'roles', ['Role2'], {
            phoneNumber: 'phone',
            foo: 'foo',
        });

        expect(user).toEqual({
            username: 'admin',
            displayName: 'Admin User',
            email: 'admin@test.com',
            pictureUrl: null,
            extraData: {
                foo: null,
                phoneNumber: '123123123',
            },
            roles: ['Role1', 'Role2', 'Role3', 'Administrator'],
            secrets: null,
        });
    });

    it('copies extra data from the user info', () => {
        const claims: IdTokenClaims = {
            aud: 'x',
            exp: 0,
            iat: 0,
            iss: 'x',
            sub: 'admin',
        };
        const userInfo: UserinfoResponse = {
            sub: 'admin',
            preferred_username: 'admin',
            name: 'Admin User',
            email: 'admin@test.com',
            picture: 'http://my-picture.com',
            roles: ['Role1', 'Role2', 'Role3'],
            phone: '222333',
        };

        const user = createUser(claims, userInfo, 'roles', ['Role2'], {
            phoneNumber: 'phone',
            foo: 'foo',
        });

        expect(user).toEqual({
            username: 'admin',
            displayName: 'Admin User',
            email: 'admin@test.com',
            pictureUrl: 'http://my-picture.com',
            extraData: {
                foo: null,
                phoneNumber: '222333',
            },
            roles: ['Role1', 'Role2', 'Role3', 'Administrator'],
            secrets: null,
        });
    });
});
