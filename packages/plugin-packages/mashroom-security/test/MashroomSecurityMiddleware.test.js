// @flow

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomSecurityMiddleware from '../src/middleware/MashroomSecurityMiddleware';

const loggerFactory: any = dummyLoggerFactory;

describe('MashroomSecurityMiddleware', () => {

    it('calls next and refreshAuthentication if the access is permitted', async () => {
        let checkAuthenticationCalled = false;
        let authenticateCalled = false;

        const req: any = {
            headers: {},
            pluginContext: {
                loggerFactory,
                services: {
                    security: {
                        service: {
                            async checkACL() {
                                return true;
                            },
                            isAuthenticated() {
                                return true;
                            },
                            async checkAuthentication() {
                                checkAuthenticationCalled = true;
                            },
                            async canAuthenticateWithoutUserInteraction() {
                                return false;
                            },
                            async authenticate() {
                                authenticateCalled = true;
                            },
                            getUser() {
                                return null;
                            }
                        }
                    }
                }
            }
        };

        const res: any = {

        };

        const next = jest.fn();

        const securityMiddleware = new MashroomSecurityMiddleware();

        await securityMiddleware.middleware()(req, res, next);

        expect(next.mock.calls.length).toBe(1);
        expect(checkAuthenticationCalled).toBeTruthy();
        expect(authenticateCalled).toBeFalsy();
    });

    it('authenticates silently without user interaction if possible on public pages', async () => {
        let authenticateCalled = false;

        const req: any = {
            headers: {},
            pluginContext: {
                loggerFactory,
                services: {
                    security: {
                        service: {
                            async checkACL() {
                                return true;
                            },
                            isAuthenticated() {
                                return true;
                            },
                            async checkAuthentication() {
                            },
                            async canAuthenticateWithoutUserInteraction() {
                                return true;
                            },
                            async authenticate() {
                                authenticateCalled = true;
                            },
                            getUser() {
                                return null;
                            }
                        }
                    }
                }
            }
        };

        const res: any = {
        };

        const next = jest.fn();

        const securityMiddleware = new MashroomSecurityMiddleware();

        await securityMiddleware.middleware()(req, res, next);

        expect(next.mock.calls.length).toBe(1);
        expect(authenticateCalled).toBeTruthy();
    });

    it('doesnt call refreshAuthentication if the x-mashroom-does-not-extend-auth header is set', async () => {
        let checkAuthenticationCalled = false;

        const req: any = {
            headers: {
                ['x-mashroom-does-not-extend-auth']: 1
            },
            pluginContext: {
                loggerFactory,
                services: {
                    security: {
                        service: {
                            async checkACL() {
                                return true;
                            },
                            isAuthenticated() {
                                return true;
                            },
                            async checkAuthentication() {
                                checkAuthenticationCalled = true;
                            },
                            async canAuthenticateWithoutUserInteraction() {
                                return false;
                            },
                            getUser() {
                                return null;
                            }
                        }
                    }
                }
            }
        };

        const res: any = {

        };

        const next = () => {};

        const securityMiddleware = new MashroomSecurityMiddleware();

        await securityMiddleware.middleware()(req, res, next);

        expect(checkAuthenticationCalled).toBeFalsy();
    });

    it('starts authentication if access is not permitted for anonymous', async () => {
        const req: any = {
            pluginContext: {
                loggerFactory,
                services: {
                    security: {
                        service: {
                            async checkACL() {
                                return false;
                            },
                            isAuthenticated() {
                                return false;
                            },
                            async authenticate() {
                                return {
                                    status: 'deferred'
                                };
                            },
                            getUser() {
                                // anonymous
                                return null;
                            }
                        }
                    }
                }
            }
        };

        const res: any = {

        };

        const next = jest.fn();

        const securityMiddleware = new MashroomSecurityMiddleware();

        await securityMiddleware.middleware()(req, res, next);

        expect(next.mock.calls.length).toBe(0);
    });

    it('sets status forbidden access is not permitted for user', async () => {
        const sendStatus = jest.fn();

        const req: any = {
            pluginContext: {
                loggerFactory,
                services: {
                    security: {
                        service: {
                            async checkACL() {
                                return false;
                            },
                            isAuthenticated() {
                                return false;
                            },
                            async authenticate() {
                                return {
                                    status: 'deferred'
                                };
                            },
                            getUser() {
                                // anonymous
                                return {};
                            }
                        }
                    }
                }
            }
        };

        const res: any = {
            sendStatus
        };

        const next = jest.fn();

        const securityMiddleware = new MashroomSecurityMiddleware();

        await securityMiddleware.middleware()(req, res, next);

        expect(next.mock.calls.length).toBe(0);
        expect(sendStatus.mock.calls.length).toBe(1);
    });


});
