// @flow

export interface LdapClient {
    search(filter: string): Promise<Array<LdapEntry>>;
    login(ldapEntry: LdapEntry, password: string): Promise<void>;
}

export type LdapEntry = {
    dn: string,
    cn: string,
    uid: string,
    mail: string,
}

export type GroupToRoleMapping = {
    [groupName: string]: Array<string>
}

export type TlsOptions = {
    ca?: string | Array<string>,
    cert: string | Array<string>,
    ciphers?: string,
    clientCertEngine?: string,
    crl?: string | Array<string>,
    dhparam?: string,
    ecdhCurve?: string,
    honorCipherOrder?: boolean,
    key?: string | Array<string>,
    maxVersion?: string,
    minVersion?: string,
    passphrase?: string,
    pfx?: string | Array<string>,
    secureOptions?: number,
    secureProtocol?: string,
    rejectUnauthorized?: boolean,
}

export type NodeTlsOptions = {
    ca?: Buffer | Array<Buffer> | null,
    cert: Buffer | Array<Buffer> | null,
    ciphers?: string,
    clientCertEngine?: string,
    crl?: Buffer | Array<Buffer> | null,
    dhparam?: string,
    ecdhCurve?: string,
    honorCipherOrder?: boolean,
    key?: Buffer | Array<Buffer> | null,
    maxVersion?: string,
    minVersion?: string,
    passphrase?: string,
    pfx?: Buffer | Array<Buffer> | null,
    secureOptions?: number,
    secureProtocol?: string,
    rejectUnauthorized?: boolean,
}
