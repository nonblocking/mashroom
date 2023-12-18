
import {loggingUtils} from '@mashroom/mashroom-utils';
import MashroomCacheControlService from '../src/MashroomCacheControlService';

describe('MashroomCacheControlService', () => {

    it('sets the Cache-Control header correctly for an unauthenticated user', () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                }
            }
        };

        let cacheControlHeader = null;
        const res: any = {
            set: (headerName: string, header: string) => {
                if (headerName === 'Cache-Control') {
                    cacheControlHeader = header;
                }
            }
        };

        const cacheControlService = new MashroomCacheControlService(false, false, 1800, loggingUtils.dummyLoggerFactory);
        cacheControlService.addCacheControlHeader('SHARED', req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('public, max-age=1800');
    });

    it('sets the Cache-Control header correctly for an authenticated user', () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                username: 'test'
                            })
                        }
                    }
                }
            }
        };

        let cacheControlHeader = null;
        const res: any = {
            set: (headerName: string, header: string) => {
                if (headerName === 'Cache-Control') {
                    cacheControlHeader = header;
                }
            }
        };

        const cacheControlService = new MashroomCacheControlService(false, false, 1800, loggingUtils.dummyLoggerFactory);
        cacheControlService.addCacheControlHeader('SHARED', req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('public, max-age=1800');
    });

    it('sets the Cache-Control header correctly for an authenticated user for private resources', () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                username: 'test'
                            })
                        }
                    }
                }
            }
        };

        let cacheControlHeader = null;
        const res: any = {
            set: (headerName: string, header: string) => {
                if (headerName === 'Cache-Control') {
                    cacheControlHeader = header;
                }
            }
        };

        const cacheControlService = new MashroomCacheControlService(false, false, 1800, loggingUtils.dummyLoggerFactory);
        cacheControlService.addCacheControlHeader('PRIVATE_IF_AUTHENTICATED', req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('private, max-age=1800');
    });

    it('doesnt set the Cache-Control header for POST requests', () => {
        const req: any = {
            method: 'POST',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
            },
        };

        let cacheControlHeader = null;
        const res: any = {
            set: (headerName: string, header: string) => {
                if (headerName === 'Cache-Control') {
                    cacheControlHeader = header;
                }
            }
        };

        const cacheControlService = new MashroomCacheControlService(false, false, 1800, loggingUtils.dummyLoggerFactory);
        cacheControlService.addCacheControlHeader('SHARED', req, res);

        expect(cacheControlHeader).toBeFalsy();
    });


    it('sets the no-cache header if disabled is true', () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
            },
        };

        let cacheControlHeader = null;
        const res: any = {
            set: (headerName: string, header: string) => {
                if (headerName === 'Cache-Control') {
                    cacheControlHeader = header;
                }
            }
        };

        const cacheControlService = new MashroomCacheControlService(false, true, 1800, loggingUtils.dummyLoggerFactory);
        cacheControlService.addCacheControlHeader('SHARED', req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('no-cache, no-store, max-age=0');
    });

    it('disables browser caching if devMode is true', () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
            },
        };

        let cacheControlHeader = null;
        const res: any = {
            set: (headerName: string, header: string) => {
                if (headerName === 'Cache-Control') {
                    cacheControlHeader = header;
                }
            }
        };

        const cacheControlService = new MashroomCacheControlService(true, false, 1800, loggingUtils.dummyLoggerFactory);
        cacheControlService.addCacheControlHeader('SHARED', req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('no-cache, no-store, max-age=0');
    });

    it('sets the no-cache header if policy is ONLY_FOR_ANONYMOUS_USERS and the user authenticated',  () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
                services: {
                    security: {
                        service: {
                            getUser: () => ({
                                username: 'test'
                            })
                        }
                    }
                }
            }
        };

        let cacheControlHeader = null;
        const res: any = {
            set: (headerName: string, header: string) => {
                if (headerName === 'Cache-Control') {
                    cacheControlHeader = header;
                }
            }
        };

        const cacheControlService = new MashroomCacheControlService(false, false, 1800, loggingUtils.dummyLoggerFactory);
        cacheControlService.addCacheControlHeader('ONLY_FOR_ANONYMOUS_USERS', req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('no-cache, no-store, max-age=0');
    });

    it('sets the no-cache header if policy is NEVER', () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory: loggingUtils.dummyLoggerFactory,
            }
        };

        let cacheControlHeader = null;
        const res: any = {
            set: (headerName: string, header: string) => {
                if (headerName === 'Cache-Control') {
                    cacheControlHeader = header;
                }
            }
        };

        const cacheControlService = new MashroomCacheControlService(false, false, 1800, loggingUtils.dummyLoggerFactory);
        cacheControlService.addCacheControlHeader('NEVER', req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('no-cache, no-store, max-age=0');
    });
});

