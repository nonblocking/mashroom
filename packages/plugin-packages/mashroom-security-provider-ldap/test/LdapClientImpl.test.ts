import {loggingUtils} from '@mashroom/mashroom-utils';
import LdapClientImpl from '../src/LdapClientImpl';
import {startMockLdapServer, stopMockLdapServer} from './mockLdapServer';
import type {LdapEntryUser} from '../type-definitions';

describe('LdapClientImpl', () => {

    beforeAll(async () => {
        await startMockLdapServer();
    });

    afterAll(async () => {
        await stopMockLdapServer();
    });

    it('binds correctly', async () => {
        const ldapClient = new LdapClientImpl('ldap://0.0.0.0:1389', 2000, 2000, 'ou=test,ou=users,dc=at,dc=nonblocking',
            'cn=admin,ou=test,ou=users,dc=at,dc=nonblocking', 'test', null, loggingUtils.dummyLoggerFactory);

        const user: LdapEntryUser = {
            dn: 'cn=john,ou=test,ou=users,dc=at,dc=nonblocking',
            cn: 'john',
            sn: 'Do',
            givenName: 'John',
            displayName: null,
            uid: 'john',
            mail: '',
        };

        await ldapClient.login(user, 'john');
    });

    it('binds fails with invalid credentials', async () => {
        const ldapClient = new LdapClientImpl('ldap://0.0.0.0:1389', 2000, 2000, 'ou=test,ou=users,dc=at,dc=nonblocking',
            'cn=admin,ou=test,ou=users,dc=at,dc=nonblocking', 'test', null, loggingUtils.dummyLoggerFactory);

        const user: LdapEntryUser = {
            dn: 'cn=john,ou=test,ou=users,dc=at,dc=nonblocking',
            cn: 'john',
            sn: 'Do',
            givenName: 'John',
            displayName: null,
            uid: 'john',
            mail: '',
        };

        try {
            await ldapClient.login(user, 'john2');
        } catch (e: any) {
            expect(e.code).toBe(49);
            expect(e.name).toBe('InvalidCredentialsError');
            return;
        }

        fail('Login should have thrown an error!');
    });

    it('executes the search correctly', async () => {
        const ldapClient = new LdapClientImpl('ldap://0.0.0.0:1389', 2000, 2000, 'ou=test,ou=users,dc=at,dc=nonblocking',
            'cn=admin,ou=test,ou=users,dc=at,dc=nonblocking', 'test', null, loggingUtils.dummyLoggerFactory);

        const result = await ldapClient.searchUser('(&(objectClass=person)(uid=john))', ['extraAttr']);
        ldapClient.shutdown();

        expect(result).toBeTruthy();
        expect(result.length).toBe(1);
        expect(result).toEqual([
            {
                dn: 'cn=john,ou=test,ou=users,dc=at,dc=nonblocking',
                cn: 'john',
                extraAttr: 'foo',
                givenName: 'John',
                mail: 'test@test.com',
                sn: 'Do',
                displayName: 'John Do',
                uid: 'john'
            }
        ]);
    });
});
