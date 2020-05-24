
import {Readable, Writable} from 'stream';
import nock from 'nock';
// @ts-ignore
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomHttpProxyService from '../src/proxy/MashroomHttpProxyService';

const createDummyRequest = (method: string, data?: string) => {
    const req: any = new Readable();
    req.method = method;
    req.headers = {
        'accept-language': 'de',
    };
    req.pluginContext = {
        loggerFactory,
        services: {

        },
    };

    req.push(data);
    req.push(null);

    return req;
};

const createDummyRequestWithSecurity = (method: string, data?: string) => {
    const req: any = new Readable();
    req.method = method;
    req.headers = {
        'accept-language': 'de',
    };
    req.pluginContext = {
        loggerFactory,
        services: {
            security: {
                service: {
                    getApiSecurityHeaders() {
                        return {
                            'Authorization': 'Bearer XXXXXXXX',
                        };
                    },
                },
            },
        },
    };

    req.push(data);
    req.push(null);

    return req;
};

const createDummyResponse = () => {
    const res: any = new Writable();
    res.statusCode = null;
    res.body = '';
    res.setHeader = (headerName: string, value: any) => {
        console.info('Header: ', headerName, value);
    };
    res.status = res.sendStatus = function(status: any) {
        this.statusCode = status;
    };
    res.write = function(chunk: any) {
        this.body += chunk.toString();
        return true;
    };

    return res;
};

describe('MashroomHttpProxyService', () => {

    it('forwards GET request to the target URI',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'foo': 'bar',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo', {
            'foo': 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('forwards POST request to the target URI',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'foo': 'bar',
            },
        })
            .post('/login')
            .reply(200, 'test post response');

        const httpProxyService = new MashroomHttpProxyService(['GET', 'POST'], [], 2000, loggerFactory);

        const req = createDummyRequest('POST', '{ "user": "test }');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/login', {
            'foo': 'bar',
        });

        expect(res.body).toBe('test post response');
    });

    it('forwards query parameters',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo?q=javascript')
            .reply(200, 'test response');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, loggerFactory);

        const req = createDummyRequest('GET');
        req.query = {
            q: 'javascript'
        };

        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('sets the correct status code if the target is not available', async () => {
        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.xxxxxx.at');

        // Expect 503 Service Unavailable
        expect(res.statusCode).toBe(503);
    });

    it('sets the correct status code if the connection times out', async () => {
        nock('https://www.yyyyyyyyyyy.at')
            .get('/')
            .socketDelay(3000)
            .reply(200, 'test response');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.yyyyyyyyyyy.at');

        // Expect 504 Gateway Timeout
        expect(res.statusCode).toBe(504);
    });

    it('passes the response from the target endpoint',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(201, 'resource created');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, loggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo')

        expect(res.statusCode).toBe(201);
    });

    it('adds security headers to the API call',  async () => {
        nock('https://www.mashroom-server.com', {
            reqheaders: {
                'Authorization': 'Bearer XXXXXXXX',
            },
        })
            .get('/foo')
            .reply(200, 'test response');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], 2000, loggerFactory);

        const req = createDummyRequestWithSecurity('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

});

