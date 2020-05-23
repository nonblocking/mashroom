
import createUser from '../src/create-user';
import {IdTokenClaims, UserinfoResponse} from 'openid-client';

describe('create-user', () => {

    it('creates a user from IDToken claims that only contains sub', () => {
        const claims: IdTokenClaims = {
            aud: 'x',
            exp: 0,
            iat: 0,
            iss: 'x',
            sub: 'admin'
        };

        const user = createUser(claims, null, null);

        expect(user).toEqual({
            username: 'admin',
            displayName: 'admin',
            email: undefined,
            pictureUrl: null,
            roles: [],
            extraData: null,
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

        const user = createUser(claims, null, null);

        expect(user).toEqual({
            username: 'admin',
            displayName: 'Admin User',
            email: 'admin@test.com',
            pictureUrl: null,
            roles: [],
            extraData: null,
        });
    });

    it('processes the role claim correctly', () => {
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

        const user = createUser(claims, null, 'roles', ['Role2']);

        expect(user).toEqual({
            username: 'admin',
            displayName: 'Admin User',
            email: 'admin@test.com',
            pictureUrl: null,
            roles: ['Role1', 'Role2', 'Role3', 'Administrator'],
            extraData: null,
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

        const user = createUser(claims, userInfo, 'roles', ['Role2']);

        expect(user).toEqual({
            username: 'admin',
            displayName: 'Admin User',
            email: 'admin@test.com',
            pictureUrl: 'http://my-picture.com',
            roles: ['Role1', 'Role2', 'Role3', 'Administrator'],
            extraData: null,
        });
    });


});
