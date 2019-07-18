// @flow
/* eslint no-console: off */

import {Readable, Writable} from 'stream';
import nock from 'nock';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import MashroomHttpProxyService from '../src/MashroomHttpProxyService';

describe('MashroomHttpProxyService', () => {

    it('forwards GET request to the target URI',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(200, 'test response');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], false, 10, 60000, dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo', {
            'foo': 'bar',
        });

        expect(res.body).toBe('test response');
    });

    it('forwards POST request to the target URI',  async () => {
        nock('https://www.mashroom-server.com')
            .post('/login')
            .reply(200, 'test post response');

        const httpProxyService = new MashroomHttpProxyService(['GET', 'POST'], [], false, 10, 60000, dummyLoggerFactory);

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

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], false, 10, 60000, dummyLoggerFactory);

        const req = createDummyRequest('GET');
        req.query = {
            q: 'javascript'
        };

        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo');

        expect(res.body).toBe('test response');
    });

    it('sets the correct status code if the target is not available', async () => {
        const httpProxyService = new MashroomHttpProxyService(['GET'], [], false, 10, 60000, dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.xxxxxx.at', {
            'foo': 'bar',
        });

        expect(res.statusCode).toBe(503);
    });

    it('passes the response from the target endpoint',  async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo')
            .reply(201, 'resource created');

        const httpProxyService = new MashroomHttpProxyService(['GET'], [], false, 10, 60000, dummyLoggerFactory);

        const req = createDummyRequest('GET');
        const res = createDummyResponse();

        await httpProxyService.forward(req, res, 'https://www.mashroom-server.com/foo', {
            'foo': 'bar',
        });

        expect(res.statusCode).toBe(201);
    });

});

const createDummyRequest = (method: string, data?: string) => {
    const req: any = new Readable();
    req.method = method;
    req.headers = {
        'accept-language': 'de',
    };

    req.push(data);
    req.push(null);

    return req;
};

const createDummyResponse = () => {
    const res: any = new Writable();
    res.statusCode = null;
    res.body = '';
    res.setHeader = (headerName, value) => {
        console.info('Header: ', headerName, value);
    };
    res.status = res.sendStatus = function(status) {
        this.statusCode = status;
    };
    res.write = function(chunk) {
        this.body += chunk.toString();
        return true;
    };

    return res;
};
