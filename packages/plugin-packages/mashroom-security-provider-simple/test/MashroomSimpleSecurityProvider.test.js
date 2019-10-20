// @flow

import path from 'path';
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomSimpleSecurityProvider from '../src/MashroomSimpleSecurityProvider';

describe('MashroomSimpleSecurityProvider', () => {

    it('redirects to the login page if an authentication is requested', async () => {
        let redirectUrl = null;

        const req: any = {
            originalUrl: '/foo/bar',
            pluginContext: {
                loggerFactory,
            }
        };
        const res: any = {
            redirect: (url) => redirectUrl = url
        };

        const userStorePath = path.resolve(__dirname, './test_users.json');

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider(userStorePath, '/login', '', 1800, loggerFactory);

        const result = await simpleSecurityProvider.authenticate(req, res);

        expect(result).toBeTruthy();
        expect(result.status).toBe('deferred');
        expect(redirectUrl).toBe('/login?ref=L2Zvby9iYXI=');
    });

    it('processes the form login correctly', async () => {
        const req: any = {
            session: {
            },
            pluginContext: {
                loggerFactory,
            }
        };

        const userStorePath = path.resolve(__dirname, './test_users.json');

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider(userStorePath, '/login', '', 1800, loggerFactory);

        const result = await simpleSecurityProvider.login(req, 'john', 'john');

        expect(result).toBeTruthy();
        expect(result.success).toBeTruthy();

        expect(req.session['__MASHROOM_SECURITY_AUTH_USER']).toEqual({
            'displayName': 'John Do',
            'roles': [
                'Editor'
            ],
            'username': 'john'
        });
    });

    it('revokes the authentication after given timeout', () => {
        const req: any = {
            session: {
                ['__MASHROOM_SECURITY_AUTH_USER']: { username: 'john' },
                ['__MASHROOM_SECURITY_AUTH_EXPIRES']: Date.now() + 2000
            }
        };

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider('/tmp', '/login', '', 1800, loggerFactory);

        const user1 = simpleSecurityProvider.getUser(req);
        expect(user1).toBeTruthy();

        req.session['__MASHROOM_SECURITY_AUTH_EXPIRES'] = Date.now() - 1;
        const user2 = simpleSecurityProvider.getUser(req);
        expect(user2).toBeFalsy();
    });

    it('returns the correct expires time', () => {
        const expiresTime = Date.now() + 2000;
        const req: any = {
            session: {
                ['__MASHROOM_SECURITY_AUTH_EXPIRES']: expiresTime
            }
        };

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider('/tmp', '/login', '', 1800, loggerFactory);

        const authExpiration = simpleSecurityProvider.getAuthenticationExpiration(req);

        expect(authExpiration).toBeTruthy();
        if (authExpiration) {
            expect(authExpiration).toBe(expiresTime);
        }
    });
});
