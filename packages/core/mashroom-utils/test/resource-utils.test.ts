
import {resolve} from 'path';
import {PassThrough} from 'stream';
import {pipeline} from 'stream/promises';
import nock from 'nock';
import {getResourceAsStream, getResourceAsString} from '../src/resource-utils';
import ResourceNotFoundError from '../src/ResourceNotFoundError';
import ResourceFetchError from '../src/ResourceFetchError';

describe('request-utils.getResourceAsStream', () => {

    it('creates a file stream', async () => {
        // File not found
        await expect(async () => await getResourceAsStream('/foo/bar.txt', {
            abortSignal: null,
        }))
            .rejects
            .toThrowError(ResourceNotFoundError);

        // File found
        const result = await getResourceAsStream(resolve(__dirname, 'data/test.txt'), {
            abortSignal: null,
        });

        expect(result).toBeTruthy();
        expect(result.stream).toBeTruthy();
        expect(result.size).toBe(12);
        expect(result.lastModified).toBeTruthy();
    });

    it('creates a file stream from an uri with a file protocol', async () => {
        const result = await getResourceAsStream(`file://${resolve(__dirname, 'data/test.txt')}`, {
            abortSignal: null,
        });

        expect(result).toBeTruthy();
        expect(result.stream).toBeTruthy();
        expect(result.size).toBe(12);
        expect(result.lastModified).toBeTruthy();
    });

    it('allows to abort slow file reading', async () => {
        const abortController = new AbortController();
        setTimeout(() => abortController.abort(), 1000);

        const result = await getResourceAsStream(resolve(__dirname, 'data/test.txt'), {
            abortSignal: abortController.signal,
        });

        try {
            for await (const chunk of result.stream) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        } catch (e: any) {
            expect(e.name).toBe('AbortError');
        }
    });

    it('creates a stream from a data url', async () => {
        const result1 = await getResourceAsStream('data:text/javascript,console.log("Foo");', {
            abortSignal: null,
        });

        expect(result1).toBeTruthy();
        expect(result1.stream).toBeTruthy();
        expect(result1.size).toBe(19);

        const result2 = await getResourceAsStream('data:text/javascript;base64,Y29uc29sZS5sb2coIkZvbyIpOw==', {
            abortSignal: null,
        });

        expect(result2).toBeTruthy();
        expect(result2.stream).toBeTruthy();
        expect(result2.size).toBe(19);
    });

    it('creates an http stream', async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo/index.js')
            .reply(200, () => 'test response', {
                'Content-Length': '13',
                'Content-Type': 'application/json',
                'Last-Modified': 'Wed, 14 Apr 2021 16:11:30 GMT',
            });

        const result = await getResourceAsStream('https://www.mashroom-server.com/foo/index.js', {
            abortSignal: null,
        });

        expect(result).toBeTruthy();
        expect(result.stream).toBeTruthy();
        expect(result.size).toBe(13);
        expect(result.contentType).toBe('application/json');
        expect(result.lastModified).toBeTruthy();
    });

    it('aborts correctly if the http server does not connect in time', async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo/index.js')
            .delayConnection(3000)
            .reply(200);

        const abortController = new AbortController();
        setTimeout(() => abortController.abort(), 1000);

        try {
            await getResourceAsStream('https://www.mashroom-server.com/foo/index.js', {
                abortSignal: abortController.signal,
            });
            fail('Should have been aborted!');
        } catch (e: any) {
            expect(e.message).toBe('Fetching aborted: https://www.mashroom-server.com/foo/index.js');
        }
    });

    it('aborts correctly if the http response takes too long ', async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo/index.js')
            .delayBody(3000)
            .reply(200);

        const abortController = new AbortController();
        setTimeout(() => abortController.abort(), 1000);

        try {
            const {stream} = await getResourceAsStream('https://www.mashroom-server.com/foo/index.js', {
                abortSignal: abortController.signal,
            });
            await pipeline(stream, new PassThrough());
            fail('Should have been aborted!');
        } catch (e: any) {
            expect(e.message).toBe('Fetching aborted: https://www.mashroom-server.com/foo/index.js');
        }
    });

    it('throws the correct error if a http resource return 404', async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo/index.js')
            .reply(404);

        await expect(getResourceAsStream('https://www.mashroom-server.com/foo/index.js', {
            abortSignal: null,
        }))
            .rejects
            .toThrowError(ResourceNotFoundError);
    });

    it('throws the correct error if a http resource return 5xx', async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo/index.js')
            .reply(505);

        await expect(getResourceAsStream('https://www.mashroom-server.com/foo/index.js', {
            abortSignal: null,
        }))
            .rejects
            .toThrowError(ResourceFetchError);
    });
});

describe('request-utils.getResourceAsString', () => {

    it('reads a text file', async () => {
        const result = await getResourceAsString(resolve(__dirname, 'data/test.txt'), {
            abortSignal: null,
        });

        expect(result).toBe('Hello World!');
    });

    it('reads an http resource', async () => {
        nock('https://www.mashroom-server.com')
            .get('/foo/index.js')
            .reply(200, () => 'test response', {
                'Content-Length': '13',
                'Content-Type': 'application/json; charset=utf-8',
            });

        const result = await getResourceAsString('https://www.mashroom-server.com/foo/index.js', {
            abortSignal: null,
        });

        expect(result).toBe('test response');
    });
});
