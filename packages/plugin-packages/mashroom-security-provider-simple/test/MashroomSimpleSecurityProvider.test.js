// @flow

import path from 'path';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomSimpleSecurityProvider from '../src/MashroomSimpleSecurityProvider';

describe('MashroomSimpleSecurityProvider', () => {

    it('redirects to the login page if an authentication is requested', async () => {
        let redirectUrl = null;

        const req: any = {
            originalUrl: '/foo/bar'
        };
        const res: any = {
            redirect: (url) => redirectUrl = url
        };

        const userStorePath = path.resolve(__dirname, './test_users.json');

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider(userStorePath, '/login', '', dummyLoggerFactory);

        const result = await simpleSecurityProvider.authenticate(req, res);

        expect(result).toBeTruthy();
        expect(result.status).toBe('deferred');
        expect(redirectUrl).toBe('/login?ref=/foo/bar');
    });

    it('processes the form login correctly', async () => {
        const req: any = {
            session: {
            }
        };

        const userStorePath = path.resolve(__dirname, './test_users.json');

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider(userStorePath, '/login', '', dummyLoggerFactory);

        const result = await simpleSecurityProvider.login(req, 'john', 'john');

        expect(result).toBeTruthy();
        expect(result.success).toBeTruthy();

        expect(req.session['__MASHROOM_SECURITY_AUTH']).toEqual({
            'displayName': 'John Do',
            'roles': [
                'Editor'
            ],
            'username': 'john'
        });
    });
});
