// @flow

import path from 'path';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomLdapSecurityProvider from '../src/MashroomLdapSecurityProvider';

const loggerFactory: any = dummyLoggerFactory;

describe('MashroomLdapSecurityProvider', () => {

    it('redirects to the login page if an authentication is requested', async () => {
        let redirectUrl = null;

        const req: any = {
            originalUrl: '/foo/bar'
        };
        const res: any = {
            redirect: (url) => redirectUrl = url
        };

        const ldapClient: any = {};
        const simpleSecurityProvider = new MashroomLdapSecurityProvider('/login', '', '', '', ldapClient, '', loggerFactory);

        const result = await simpleSecurityProvider.authenticate(req, res);

        expect(result).toBeTruthy();
        expect(result.status).toBe('deferred');
        expect(redirectUrl).toBe('/login?ref=/foo/bar');
    });

    it('processes the login correctly', async () => {
        const userSearchFilter = '(&(objectClass=person)(uid=@username@))';
        const groupSearchFilter = '(objectClass=group)';
        const groupToRoleMappingPath = path.resolve(__dirname, './groupToRoleMapping.json');
        const serverRootFolder = __dirname;

        const mockLogin = jest.fn((user, password) => {
            if (user.dn === 'User1' && password === 'passwd') {
                return Promise.resolve();
            } else {
                return Promise.reject();
            }
        });
        const mockSearch = jest.fn((filter) => {
            if (filter.indexOf('objectClass=person') !== -1 && filter.indexOf('username') !== -1) {
                return Promise.resolve([{ dn: 'User1', cn: 'User1' }]);
            } else if (filter.indexOf('objectClass=group') !== -1 && filter.indexOf('User1') !== 1) {
                return Promise.resolve([{ dn: 'GROUP1', cn: 'GROUP1' }]);
            }
            return Promise.resolve([]);
        });

        const ldapClient: any = {
            login: mockLogin,
            search: mockSearch,
        };

        const req: any = {
            session: {}
        };

        const provider = new MashroomLdapSecurityProvider('/login', userSearchFilter, groupSearchFilter, groupToRoleMappingPath, ldapClient, serverRootFolder, loggerFactory);

        const result = await provider.login(req, 'username', 'passwd');

        expect(result).toBeTruthy();
        expect(result.success).toBeTruthy();

        const user = provider.getUser(req);
        expect(user).toBeTruthy();
        expect(user.username).toBe('username');
        expect(user.displayName).toBe('User1');
        expect(user.groups).toEqual(['GROUP1']);
        expect(user.roles).toEqual(['ROLE1', 'ROLE2']);
    });
});
