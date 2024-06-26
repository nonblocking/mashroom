
import path from 'path';
import {loggingUtils} from '@mashroom/mashroom-utils';
import MashroomSimpleSecurityProvider from '../src/MashroomSimpleSecurityProvider';

describe('MashroomSimpleSecurityProvider', () => {

    it('redirects to the login page if an authentication is requested', async () => {
        let redirectUrl = null;

        const req: any = {
            originalUrl: '/foo/bar',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
            }
        };
        const res: any = {
            redirect: (url: string) => redirectUrl = decodeURIComponent(url)
        };

        const userStorePath = path.resolve(__dirname, './test-users.json');

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider(userStorePath, '/login', '', 1800, loggingUtils.dummyLoggerFactory);

        const result = await simpleSecurityProvider.authenticate(req, res);

        expect(result).toBeTruthy();
        expect(result.status).toBe('deferred');
        expect(redirectUrl).toBe('/login?redirectUrl=%2Ffoo%2Fbar');
    });

    it('cancels the authentication process if the original url is the login page itself', async () => {
        let redirectUrl = null;

        const req: any = {
            originalUrl: '/login?redirectUrl=https://foo.com',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
            }
        };
        const res: any = {
            redirect: (url: string) => redirectUrl = url
        };

        const userStorePath = path.resolve(__dirname, './test-users.json');

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider(userStorePath, '/login', '', 1800, loggingUtils.dummyLoggerFactory);

        const result = await simpleSecurityProvider.authenticate(req, res);

        expect(result).toBeTruthy();
        expect(result.status).toBe('error');
    });

    it('passes the authentication hints to the login page', async () => {
        let redirectUrl = null;

        const req: any = {
            originalUrl: '/foo/bar',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
            }
        };
        const res: any = {
            redirect: (url: string) => redirectUrl = decodeURIComponent(url)
        };

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider('/tmp', '/login', '', 1800, loggingUtils.dummyLoggerFactory);

        const result = await simpleSecurityProvider.authenticate(req, res, {
            hint1: 'foo',
            hint2: 2,
        });

        expect(result).toBeTruthy();
        expect(result.status).toBe('deferred');
        expect(redirectUrl).toBe('/login?redirectUrl=%2Ffoo%2Fbar&hint1=foo&hint2=2');
    });

    it('processes the form login correctly', async () => {
        const req: any = {
            session: {
                save: (cb: () => void) => cb(),
                cookie: {
                },
            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            addRoleDefinition: () => { /* nothing to do */ },
                            getExistingRoles: () => Promise.resolve([]),
                        }
                    }
                }
            }
        };

        const userStorePath = path.resolve(__dirname, './test-users.json');

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider(userStorePath, '/login', '', 1800, loggingUtils.dummyLoggerFactory);

        const result = await simpleSecurityProvider.login(req, 'john', 'john');

        expect(result).toBeTruthy();
        expect(result.success).toBeTruthy();

        expect(req.session['__MASHROOM_SECURITY_SIMPLE_AUTH_USER']).toEqual({
            displayName: 'John Do',
            email: 'john@xxxxxx.com',
            pictureUrl: undefined,
            username: 'john',
            extraData: {
                test: 2
            },
            roles: [
                'Editor'
            ],
            secrets: {
                token: 'bar'
            }
        });
    });

    it('returns the correct failure reason if login fails', async () => {
        const req: any = {
            session: {
            },
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            addRoleDefinition: () => { /* nothing to do */ },
                            getExistingRoles: () => Promise.resolve([]),
                        }
                    }
                }
            }
        };

        const userStorePath = path.resolve(__dirname, './test-users.json');

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider(userStorePath, '/login', '', 1800, loggingUtils.dummyLoggerFactory);

        const result = await simpleSecurityProvider.login(req, 'john', 'john2');

        expect(result).toBeTruthy();
        expect(result.success).toBeFalsy();
        expect(result.failureReason).toBe('Invalid credentials');
    });

    it('revokes the authentication after given timeout', () => {
        const req: any = {
            session: {
                ['__MASHROOM_SECURITY_SIMPLE_AUTH_USER']: { username: 'john' },
                ['__MASHROOM_SECURITY_SIMPLE_AUTH_EXPIRES']: Date.now() + 2000
            }
        };

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider('/tmp', '/login', '', 1800, loggingUtils.dummyLoggerFactory);

        const user1 = simpleSecurityProvider.getUser(req);
        expect(user1).toBeTruthy();

        req.session['__MASHROOM_SECURITY_SIMPLE_AUTH_EXPIRES'] = Date.now() - 1;
        const user2 = simpleSecurityProvider.getUser(req);
        expect(user2).toBeFalsy();
    });

    it('returns the correct expires time', () => {
        const expiresTime = Date.now() + 2000;
        const req: any = {
            session: {
                ['__MASHROOM_SECURITY_SIMPLE_AUTH_EXPIRES']: expiresTime
            }
        };

        const simpleSecurityProvider = new MashroomSimpleSecurityProvider('/tmp', '/login', '', 1800, loggingUtils.dummyLoggerFactory);

        const authExpiration = simpleSecurityProvider.getAuthenticationExpiration(req);

        expect(authExpiration).toBeTruthy();
        if (authExpiration) {
            expect(authExpiration).toBe(expiresTime);
        }
    });
});
