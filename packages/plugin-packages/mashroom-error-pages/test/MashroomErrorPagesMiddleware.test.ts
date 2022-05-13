/* eslint @typescript-eslint/no-empty-function: off */

import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomErrorPagesMiddleware from '../src/MashroomErrorPagesMiddleware';
import type {ErrorMapping} from '../type-definitions';

describe('MashroomErrorPagesMiddleware', () => {

    it('sends an error page if statusCode is >= 400 and the mapping defines a valid file', (done) => {
        const req: any = {
            method: 'GET',
            headers: {
                accept: 'text/html',
            },
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                }
            }
        };
        const res: any = {
            statusCode: 404,
            removeHeader: () => {},
            setHeader: () => {},
            write: (chunk: any) => {},
            end: (chunk: any) => {
                expect(chunk).toContain('404');
                done();
            }
        }


        const mapping: ErrorMapping = {
            '404': './html/404.html'
        }

        const mashroomErrorPagesMiddleware = new MashroomErrorPagesMiddleware(__dirname, '1.0.0', mapping);

        mashroomErrorPagesMiddleware.middleware()(req, res, () => {});

        res.end('foo');
    });

    it('sends an error page if a default file exists in the mapping', (done) => {
        const req: any = {
            method: 'GET',
            headers: {
                accept: 'text/html',
            },
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                }
            }
        };
        const res: any = {
            statusCode: 404,
            removeHeader: () => {},
            setHeader: () => {},
            write: (chunk: any) => {},
            end: (chunk: any) => {
                expect(chunk).toContain('404');
                done();
            }
        }


        const mapping: ErrorMapping = {
            'default': './html/404.html'
        }

        const mashroomErrorPagesMiddleware = new MashroomErrorPagesMiddleware(__dirname, '1.0.0', mapping);

        mashroomErrorPagesMiddleware.middleware()(req, res, () => {});

        res.end('foo');
    });

    it('sends the original content if the error page cannot be loaded', (done) => {
        const req: any = {
            method: 'GET',
            headers: {
                accept: 'text/html',
            },
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                }
            }
        };
        const res: any = {
            statusCode: 404,
            setHeader: () => {},
            write: (chunk: any) => {},
            end: (chunk: any) => {
                expect(chunk).toEqual('foo');
                done();
            }
        }

        const mapping: ErrorMapping = {
            '404': './html/non_existing.html'
        }

        const mashroomErrorPagesMiddleware = new MashroomErrorPagesMiddleware(__dirname, '1.0.0', mapping);

        mashroomErrorPagesMiddleware.middleware()(req, res, () => {});

        res.end('foo');
    });

    it('processes placeholder correctly', (done) => {
        const req: any = {
            method: 'GET',
            originalUrl: '/the/resource?a=b',
            headers: {
                accept: 'text/html',
            },
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                }
            }
        };
        const res: any = {
            statusCode: 404,
            removeHeader: () => {},
            setHeader: () => {},
            write: (chunk: any) => {},
            end: (chunk: any) => {
                expect(chunk).toContain('status for /the/resource?a=b: 404');
                expect(chunk).toContain('server version 1.0.0');
                done();
            }
        }


        const mapping: ErrorMapping = {
            '404': './html/404_2.html'
        }

        const mashroomErrorPagesMiddleware = new MashroomErrorPagesMiddleware(__dirname, '1.0.0', mapping);

        mashroomErrorPagesMiddleware.middleware()(req, res, () => {});

        res.end('foo');
    });

    it('translates messages correctly', (done) => {
        const req: any = {
            method: 'GET',
            originalUrl: '/the/resource',
            headers: {
                accept: 'text/html',
            },
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    i18n: {
                        service: {
                            getLanguage: () => 'de',
                            getMessage: (key: string) => {
                                if (key === 'hello') {
                                    return 'Hallo';
                                }
                                return null;
                            }
                        }
                    }
                }
            }
        };
        const res: any = {
            statusCode: 404,
            removeHeader: () => {},
            setHeader: () => {},
            write: (chunk: any) => {},
            end: (chunk: any) => {
                expect(chunk).toContain('<div>Hallo World</div>');
                done();
            }
        }


        const mapping: ErrorMapping = {
            '404': './html/404_3.html'
        }

        const mashroomErrorPagesMiddleware = new MashroomErrorPagesMiddleware(__dirname, '1.0.0', mapping);

        mashroomErrorPagesMiddleware.middleware()(req, res, () => {});

        res.end('foo');
    });

    it('encodes the original url to avoid reflected xss', (done) => {
        const req: any = {
            method: 'GET',
            originalUrl: '/the/resource?a<script>alert(1)</script>b',
            headers: {
                accept: 'text/html',
            },
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                }
            }
        };
        const res: any = {
            statusCode: 404,
            removeHeader: () => {},
            setHeader: () => {},
            write: (chunk: any) => {},
            end: (chunk: any) => {
                expect(chunk).toContain('status for /the/resource?a%3Cscript%3Ealert(1)%3C/script%3Eb: 404');
                expect(chunk).toContain('server version 1.0.0');
                done();
            }
        }


        const mapping: ErrorMapping = {
            '404': './html/404_2.html'
        }

        const mashroomErrorPagesMiddleware = new MashroomErrorPagesMiddleware(__dirname, '1.0.0', mapping);

        mashroomErrorPagesMiddleware.middleware()(req, res, () => {});

        res.end('foo');
    });

});

