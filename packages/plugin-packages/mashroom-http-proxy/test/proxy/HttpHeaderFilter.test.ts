
import HttpHeaderFilter from '../../src/proxy/HttpHeaderFilter';

describe('HttpHeaderFilter', () => {

    const forwardHeaders = [
        'accept',
        'accept-*',
        'range',
        'expires',
        'cache-control',
        'last-modified',
        'content-*',
        'x-b3-*',
        'trace*',
    ];

    it('removes the headers that are not listed in forwardHeaders',  async () => {

        const filter = new HttpHeaderFilter(forwardHeaders);

        const headers = {
            Accept: '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,de;q=0.7',
            'cache-control': 'no-cache',
            Connection: 'keep-alive',
            cookie: 'dfdF',
            'content-type': 'application/json',
            'content-size': '42',
            'x-b3-trace-id': 'sdfdfdfd',
            'x-foo-bar': 'test',
            'x-content-type': 'test',
            'traceparent': '00-8d21fa8668b3ceb4b531f6f43e5b45d2-e13f9bad2756b4b9-01'
        };

        filter.removeUnwantedHeaders(headers);

        expect(headers).toEqual({
            Accept: '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,de;q=0.7',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'content-size': '42',
            'x-b3-trace-id': 'sdfdfdfd',
            'traceparent': '00-8d21fa8668b3ceb4b531f6f43e5b45d2-e13f9bad2756b4b9-01'
        });
    });

    it('returns the filtered headers',  async () => {

        const filter = new HttpHeaderFilter(forwardHeaders);

        const headers = {
            Accept: '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,de;q=0.7',
            'cache-control': 'no-cache',
            Connection: 'keep-alive',
            cookie: 'dfdF',
            'content-type': 'application/json',
            'content-size': '42',
            'x-b3-trace-id': 'sdfdfdfd',
            'x-foo-bar': 'test',
            'x-content-type': 'test',
            'traceparent': '00-8d21fa8668b3ceb4b531f6f43e5b45d2-e13f9bad2756b4b9-01'
        };

        const filtered = filter.filter(headers);

        expect(filtered).toEqual({
            Accept: '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,de;q=0.7',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'content-size': '42',
            'x-b3-trace-id': 'sdfdfdfd',
            'traceparent': '00-8d21fa8668b3ceb4b531f6f43e5b45d2-e13f9bad2756b4b9-01'
        });
    });
});
