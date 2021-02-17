
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import fixTlsOptions from '../src/fix_tls_options';

import type {TlsOptions} from '../type-definitions';

const loggerFactory: any = dummyLoggerFactory;

describe('fix_tls_options', () => {

    it('processes certificate paths correctly', async () => {

        const tlsOptions: TlsOptions = {
            key: './client-key.pem',
            cert: './test-client-cert.pem',
            rejectUnauthorized: true,
            ca: [ './server-cert.pem' ]
        };


        const fixedTlsOptions = fixTlsOptions(tlsOptions, __dirname, loggerFactory);

        expect(fixedTlsOptions).toBeTruthy();
        if (fixedTlsOptions) {
            expect(fixedTlsOptions.cert && fixedTlsOptions.cert.length).toBe(1);
            expect(fixedTlsOptions.cert && fixedTlsOptions.cert[0].toString().indexOf('-----BEGIN CERTIFICATE-----')).toBe(0);
            expect(fixedTlsOptions.key).toEqual([]);
            expect(fixedTlsOptions.ca).toEqual([]);
        }
    });
});
