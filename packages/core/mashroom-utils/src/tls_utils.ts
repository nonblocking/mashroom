
import fs from 'fs';
import path from 'path';

import type {TlsOptions} from 'tls';

type Logger = {
    debug(debug: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

const CERT_PROPERTIES: Array<keyof TlsOptions> = ['cert', 'ca', 'key', 'crl', 'pfx'];

export const fixTlsOptions = (tlsOptions: TlsOptions | undefined | null, serverRootFolder: string, logger: Logger): TlsOptions | null => {
    if (!tlsOptions) {
        return null;
    }

    const fixedTlsOptions: TlsOptions = {
        ...tlsOptions
    };

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
                // @ts-ignore
                fixedTlsOptions[certPropName] = fixedCertArray || [];
            }
        }
    });

    return fixedTlsOptions;
};


