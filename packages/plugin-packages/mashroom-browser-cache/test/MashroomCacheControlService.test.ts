
// @ts-ignore
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomCacheControlService from '../src/MashroomCacheControlService';

describe('MashroomCacheControlService', () => {

    it('sets the Cache-Control header correctly for an unauthenticated user', async () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory,
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

        const cacheControlService = new MashroomCacheControlService(false, false, false, 1800, loggerFactory);
        await cacheControlService.addCacheControlHeader(req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('public, max-age=1800');
    });

    it('sets the Cache-Control header correctly for an authenticated user', async () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory,
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

        const cacheControlService = new MashroomCacheControlService(false, false, false, 1800, loggerFactory);
        await cacheControlService.addCacheControlHeader(req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('private, max-age=1800');
    });

    it('doesnt set the Cache-Control header for POST requests', async () => {
        const req: any = {
            method: 'POST',
            pluginContext: {
                loggerFactory,
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

        const cacheControlService = new MashroomCacheControlService(false, false, false, 1800, loggerFactory);
        await cacheControlService.addCacheControlHeader(req, res);

        expect(cacheControlHeader).toBeFalsy();
    });


    it('sets the no-cache header if disabled is true', async () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory,
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

        const cacheControlService = new MashroomCacheControlService(false, true, false, 1800, loggerFactory);
        await cacheControlService.addCacheControlHeader(req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('no-cache, no-store, must-revalidate');
    });

    it('disables browser caching if devMode is true', async () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory,
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

        const cacheControlService = new MashroomCacheControlService(true, false, false, 1800, loggerFactory);
        await cacheControlService.addCacheControlHeader(req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('no-cache, no-store, must-revalidate');
    });

    it('sets the no-cache header if disabledWhenAuthenticated is true and the user authenticated', async () => {
        const req: any = {
            method: 'GET',
            pluginContext: {
                loggerFactory,
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

        const cacheControlService = new MashroomCacheControlService(false, false, true, 1800, loggerFactory);
        await cacheControlService.addCacheControlHeader(req, res);

        expect(cacheControlHeader).toBeTruthy();
        expect(cacheControlHeader).toBe('no-cache, no-store, must-revalidate');
    });


});

