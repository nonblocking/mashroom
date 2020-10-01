
import fs from 'fs';
import path from 'path';

import type {TlsOptions as NodeTlsOptions} from 'tls';
import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {TlsOptions} from '../type-definitions';

const CERT_PROPERTIES: Array<keyof TlsOptions> = ['cert', 'ca', 'key', 'crl', 'pfx'];

export default (optionalTlsOptions: TlsOptions | undefined | null, serverRootFolder: string, loggerFactory: MashroomLoggerFactory): NodeTlsOptions | undefined | null => {
    if (!optionalTlsOptions) {
        return optionalTlsOptions;
    }

    const tlsOptions: TlsOptions = optionalTlsOptions;
    const fixedTlsOptions: any = {
        ...tlsOptions
    };
    const logger = loggerFactory('mashroom.security.provider.ldap');

    CERT_PROPERTIES.forEach((certPropName) => {
        if (tlsOptions.hasOwnProperty(certPropName)) {
            const certs = tlsOptions[certPropName] as string | Array<string>;
            if (certs) {
                const certArray = Array.isArray(certs) ? certs : [certs];
                let fixedCertArray: Array<string | Buffer | null> = certArray.map((certPath) => {
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

                fixedCertArray = fixedCertArray.filter((cert) => cert !== null);
                fixedTlsOptions[certPropName] = fixedCertArray;
            }
        }
    });

    logger.debug('LDAP TLS options: ', { tlsOptions: fixedTlsOptions });
    return fixedTlsOptions;
}


