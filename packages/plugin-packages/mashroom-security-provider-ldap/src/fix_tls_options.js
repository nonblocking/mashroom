// @flow

import fs from 'fs';
import path from 'path';

import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {NodeTlsOptions, TlsOptions} from '../type-definitions';

const CERT_PROPERTIES = ['cert', 'ca', 'key', 'crl', 'pfx'];

export default (optionalTlsOptions: ?TlsOptions, serverRootFolder: string, loggerFactory: MashroomLoggerFactory): ?NodeTlsOptions => {
    if (!optionalTlsOptions) {
        return optionalTlsOptions;
    }

    const tlsOptions: TlsOptions = optionalTlsOptions;
    const fixedTlsOptions: NodeTlsOptions = {...(tlsOptions: any)};
    const logger = loggerFactory('mashroom.security.provider.ldap');

    CERT_PROPERTIES.forEach((certPropName) => {
        if (tlsOptions.hasOwnProperty(certPropName)) {
            let certs = tlsOptions[certPropName];
            if (certs) {
                if (!Array.isArray(certs)) {
                    certs = [certs];
                }
                certs = certs.map((certPath) => {
                    if (!path.isAbsolute(certPath)) {
                        certPath = path.resolve(serverRootFolder, certPath);
                    }
                    if (!fs.existsSync(certPath)) {
                        logger.warn(`Certificate path not found: ${certPath}`);
                        return null;
                    } else {
                        return fs.readFileSync(certPath);
                    }
                });

                certs = certs.filter((cert) => cert !== null);

                fixedTlsOptions[certPropName] = (certs: any);
            }
        }
    });

    logger.debug('LDAP TLS options: ', {tlsOptions: fixedTlsOptions});
    return fixedTlsOptions;
}


