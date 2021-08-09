
import path from 'path';
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomLdapSecurityProvider from '../src/MashroomLdapSecurityProvider';

describe('MashroomLdapSecurityProvider', () => {

    it('redirects to the login page if an authentication is requested', async () => {
        let redirectUrl = null;

        const req: any = {
            originalUrl: '/foo/bar'
        };
        const res: any = {
            redirect: (url: string) => redirectUrl = url
        };

        const ldapClient: any = {};
        const simpleSecurityProvider = new MashroomLdapSecurityProvider('/login', '', '', null, null,
            null, null, ldapClient, '', 1800, loggerFactory);

        const result = await simpleSecurityProvider.authenticate(req, res);

        expect(result).toBeTruthy();
        expect(result.status).toBe('deferred');
        expect(redirectUrl).toBe('/login?redirectUrl=%2Ffoo%2Fbar');
    });

    it('passes the authentication hints to the login page', async () => {
        let redirectUrl = null;

        const req: any = {
            originalUrl: '/foo/bar'
        };
        const res: any = {
            redirect: (url: string) => redirectUrl = url
        };

        const ldapClient: any = {};
        const simpleSecurityProvider = new MashroomLdapSecurityProvider('/login', '', '', null, null,
            null , null, ldapClient, '', 1800, loggerFactory);

        const result = await simpleSecurityProvider.authenticate(req, res, {
            hint1: 'foo',
            hint2: 2,
        });

        expect(result).toBeTruthy();
        expect(result.status).toBe('deferred');
        expect(redirectUrl).toBe('/login?redirectUrl=%2Ffoo%2Fbar&hint1=foo&hint2=2');
    });

    it('processes the login correctly', async () => {
        const userSearchFilter = '(&(objectClass=person)(uid=@username@))';
        const groupSearchFilter = '(objectClass=group)';
        const groupToRoleMappingPath = path.resolve(__dirname, './groupToRoleMapping.json');
        const userToRoleMappingPath = path.resolve(__dirname, './userToRoleMapping.json');
        const serverRootFolder = __dirname;

        const mockLogin = jest.fn((user, password) => {
            if (user.dn === 'uid=user1,ou=users,dc=nonblocking,dc=at' && password === 'passwd') {
                return Promise.resolve();
            } else {
                return Promise.reject();
            }
        });
        const mockSearch = jest.fn((filter, extraAttributes) => {
            if (filter.indexOf('objectClass=person') !== -1 && filter.indexOf('user1') !== -1) {
                return Promise.resolve([{
                    dn: 'uid=user1,ou=users,dc=nonblocking,dc=at',
                    cn: 'user1',
                    sn: 'User',
                    givenName: 'Test',
                    displayName: null,
                    uid: '1111111',
                    mail: 'user@test.com',
                    mobiletelephonenumber: extraAttributes.includes('mobiletelephonenumber') ? '0043123123123' : undefined,
                }]);
            } else if (filter.indexOf('objectClass=group') !== -1 && filter.indexOf('User1') !== 1) {
                return Promise.resolve([{
                    dn: 'cn=group1,ou=users,dc=nonblocking,dc=at',
                    cn: 'GROUP1'
                }]);
            }
            return Promise.resolve([]);
        });

        const ldapClient: any = {
            login: mockLogin,
            search: mockSearch,
        };

        const req: any = {
            session: {
                save: (cb: () => void) => cb(),
            },
            pluginContext: {
                loggerFactory,
                services: {
                    security: {
                        service: {
                            addRoleDefinition: () => { /* nothing to do */ },
                            getExistingRoles: () => Promise.resolve([]),

                        }
                    }
                }
            },
        };

        const extraDataMapping = {
            'mobile': 'mobiletelephonenumber'
        };
        const secretsMapping = {
            'internalUserId': 'uid'
        };
        const provider = new MashroomLdapSecurityProvider('/login', userSearchFilter, groupSearchFilter, extraDataMapping,
            secretsMapping, groupToRoleMappingPath, userToRoleMappingPath, ldapClient, serverRootFolder, 1800, loggerFactory);

        const result = await provider.login(req, 'user1', 'passwd');

        expect(result).toBeTruthy();
        expect(result.success).toBeTruthy();

        const user = provider.getUser(req);
        expect(user).toEqual({
            username: 'user1',
            displayName: 'Test User',
            email: 'user@test.com',
            pictureUrl: null,
            extraData: {
                mobile: '0043123123123'
            },
            secrets: {
                internalUserId: '1111111'
            },
            roles: [
                'ROLE1',
                'ROLE2',
                'ROLE5'
            ],
        });
    });

    it('revokes the authentication after given timeout', () => {
        const ldapClient: any = {
        };
        const req: any = {
            session: {
                ['__MASHROOM_SECURITY_LDAP_AUTH_USER']: { username: 'john' },
                ['__MASHROOM_SECURITY_LDAP_AUTH_EXPIRES']: Date.now() + 2000
            }
        };

        const provider = new MashroomLdapSecurityProvider('/login', '', '', null,  null,
            null, null, ldapClient, '', 1800, loggerFactory);

        const user1 = provider.getUser(req);
        expect(user1).toBeTruthy();

        req.session['__MASHROOM_SECURITY_LDAP_AUTH_EXPIRES'] = Date.now() - 1;
        const user2 = provider.getUser(req);
        expect(user2).toBeFalsy();
    });

    it('returns the correct expires time', () => {
        const ldapClient: any = {
        };
        const expiresTime = Date.now() + 2000;
        const req: any = {
            session: {
                ['__MASHROOM_SECURITY_LDAP_AUTH_EXPIRES']: expiresTime
            }
        };

        const provider = new MashroomLdapSecurityProvider('/login', '', '', null, null,
            null, null, ldapClient, '', 1800, loggerFactory);

        const authExpiration = provider.getAuthenticationExpiration(req);

        expect(authExpiration).toBeTruthy();
        if (authExpiration) {
            expect(authExpiration).toBe(expiresTime);
        }
    });
});
