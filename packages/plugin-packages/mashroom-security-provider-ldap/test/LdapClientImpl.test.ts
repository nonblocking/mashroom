import {loggingUtils} from '@mashroom/mashroom-utils';
import LdapClientImpl from '../src/LdapClientImpl';
import type {LdapEntryUser} from '../type-definitions';

const LDAP_URL = 'ldap://localhost:1389';
const LDAP_BASE_DN = 'ou=users,dc=nonblocking,dc=at';
const LDAP_SEARCH_BIND_DN = 'uid=mashroom,ou=applications,dc=nonblocking,dc=at';
const LDAP_SEARCH_PASSWORD = 'mashroom';

// To execute this remove the .skip here and run docker-compose up in the openldap folder
describe.skip('LdapClientImpl', () => {

    it('binds correctly', async () => {
        const ldapClient = new LdapClientImpl(LDAP_URL, 2000, 2000, LDAP_BASE_DN,
            LDAP_SEARCH_BIND_DN, LDAP_SEARCH_PASSWORD, null, loggingUtils.dummyLoggerFactory);

        const user: LdapEntryUser = {
            dn: 'uid=john,ou=users,dc=nonblocking,dc=at',
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
        const ldapClient = new LdapClientImpl(LDAP_URL, 2000, 2000, LDAP_BASE_DN,
            LDAP_SEARCH_BIND_DN, LDAP_SEARCH_PASSWORD, null, loggingUtils.dummyLoggerFactory);

        const user: LdapEntryUser = {
            dn: 'uid=john,ou=users,dc=nonblocking,dc=at',
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
            expect(e.constructor.name).toBe('InvalidCredentialsError');
            expect(e.message).toBe(' Code: 0x31');
            return;
        }

        throw new Error('Login should have thrown an error!');
    });

    it('executes the search correctly', async () => {
        const ldapClient = new LdapClientImpl(LDAP_URL, 2000, 2000, LDAP_BASE_DN,
            LDAP_SEARCH_BIND_DN, LDAP_SEARCH_PASSWORD, null, loggingUtils.dummyLoggerFactory);

        const result = await ldapClient.searchUser('(&(objectClass=person)(uid=john))', ['mobile']);
        ldapClient.shutdown();

        expect(result).toBeTruthy();
        expect(result.length).toBe(1);
        expect(result).toEqual([
            {
                dn: 'uid=john,ou=users,dc=nonblocking,dc=at',
                cn: 'john',
                mobile: '0043123123123',
                givenName: 'John',
                mail: 'john@nonblocking.at',
                sn: 'Do',
                displayName: 'John Do',
                uid: 'john'
            }
        ]);
    });
});
