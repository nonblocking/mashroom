// @flow
/* eslint no-console: off */

import HttpHeaderFilter from '../src/HttpHeaderFilter';

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
            'x-b3-trace-id': 'sdfdfdfd'
        };

        filter.filter(headers);

        expect(headers).toEqual({
            Accept: '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,de;q=0.7',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'x-b3-trace-id': 'sdfdfdfd'
        });
    });


});
