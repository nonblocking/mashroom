// @flow

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomSecurityMiddleware from '../src/middleware/MashroomSecurityMiddleware';

const loggerFactory: any = dummyLoggerFactory;

describe('MashroomSecurityMiddleware', () => {

    it('calls next if the access is permitted', async () => {
        const req: any = {
            pluginContext: {
                services: {
                    security: {
                        service: {
                            async checkACL() {
                                return true;
                            }
                        }
                    }
                }
            }
        };

        const res: any = {

        };

        const next = jest.fn();

        const securityMiddleware = new MashroomSecurityMiddleware(loggerFactory);

        await securityMiddleware.middleware()(req, res, next);

        expect(next.mock.calls.length).toBe(1);
    });

    it('starts authentication if access is not permitted for anonymous', async () => {
        const req: any = {
            pluginContext: {
                services: {
                    security: {
                        service: {
                            async checkACL() {
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

        const securityMiddleware = new MashroomSecurityMiddleware(loggerFactory);

        await securityMiddleware.middleware()(req, res, next);

        expect(next.mock.calls.length).toBe(0);
    });

    it('sets status forbidden access is not permitted for user', async () => {
        const sendStatus = jest.fn();

        const req: any = {
            pluginContext: {
                services: {
                    security: {
                        service: {
                            async checkACL() {
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

        const securityMiddleware = new MashroomSecurityMiddleware(loggerFactory);

        await securityMiddleware.middleware()(req, res, next);

        expect(next.mock.calls.length).toBe(0);
        expect(sendStatus.mock.calls.length).toBe(1);
    });


});
