
import {fixTlsOptions} from '../src/tls-utils';

describe('tls-utils.fixTlsOptions', () => {

    it('processes certificate paths correctly', () => {

        const tlsOptions = {
            key: './client-key.pem',
            cert: './data/test-client-cert.pem',
            rejectUnauthorized: true,
            ca: [ './server-cert.pem' ]
        };


        const fixedTlsOptions = fixTlsOptions(tlsOptions, __dirname, console);

        expect(fixedTlsOptions).toBeTruthy();
        if (fixedTlsOptions) {
            expect(fixedTlsOptions.cert && fixedTlsOptions.cert.length).toBe(1);
            expect(fixedTlsOptions.cert && fixedTlsOptions.cert[0].toString().indexOf('-----BEGIN CERTIFICATE-----')).toBe(0);
            expect(fixedTlsOptions.key).toEqual([]);
            expect(fixedTlsOptions.ca).toEqual([]);
        }
    });
});
