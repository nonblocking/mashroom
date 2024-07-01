
import { Client as LdapTsClient } from 'ldapts';

import type {SearchOptions, ClientOptions} from 'ldapts';
import type {TlsOptions} from 'tls';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {BaseLdapEntry, LdapEntryUser, LdapClient} from '../type-definitions';

const DEFAULT_ATTRIBUTES = ['dn', 'cn', 'sn', 'givenName', 'displayName', 'uid', 'mail'];

// See https://ldap.com/ldap-result-code-reference/
const ERROR_NO_SUCH_OBJECT = 32;

const getAttributeValue = (name: string, attributes: Record<string, Buffer | Buffer[] | string[] | string>): string | undefined => {
    if (!(name in attributes)) {
        return undefined;
    }
    let value = attributes[name];
    if (Array.isArray(value)) {
        value = value[0];
    }
    if (typeof value === 'string') {
        return value;
    }
    return value?.toString();
};

const getAttributeValues = (name: string, attributes: Record<string, Buffer | Buffer[] | string[] | string>): Array<string> | undefined => {
    if (!(name in attributes)) {
        return undefined;
    }
    const value = attributes[name];
    const values = Array.isArray(value) ? value : [value];
    return values.map((value) => {
        if (typeof value === 'string') {
            return value;
        }
        return value?.toString();
    });
};

export default class LdapClientImpl implements LdapClient {

    private _logger: MashroomLogger;
    private _searchClient: LdapTsClient | null;

    constructor(private _serverUrl: string, private _connectTimeout: number, private _timeout: number,
                private _baseDN: string, private _bindDN: string, private _bindCredentials: string,
                private _tlsOptions: TlsOptions | undefined | null, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.security.provider.ldap');
        this._searchClient = null;
    }

    async searchUser(filter: string, extraAttributes?: Array<string>): Promise<Array<LdapEntryUser>> {
        const searchClient = await this.getSearchClient();

        let attributes = [
            ...DEFAULT_ATTRIBUTES,
        ];
        if (extraAttributes) {
            extraAttributes.forEach((extraAttribute) => {
               if (!attributes.includes(extraAttribute)) {
                   attributes.push(extraAttribute);
               }
            });
        }

        // For some reason in the attribute names need now to be lower case
        attributes = attributes.map((a) => a.toLowerCase());

        const searchOpts: SearchOptions = {
            filter,
            scope: 'sub',
            attributes,
        };

        let result;
        try {
            result = await searchClient.search(this._baseDN, searchOpts);
        } catch (e: any) {
            if (e.code === ERROR_NO_SUCH_OBJECT) {
                return [];
            }
            throw new Error(`LDAP user search failed: ${e.message}`);
        }

        const entries: Array<LdapEntryUser> = [];
        result.searchEntries.forEach(({ dn, ...attributes }) => {
            const cns = getAttributeValues('cn', attributes);
            const sn = getAttributeValue('sn', attributes);
            const givenName = getAttributeValue('givenName', attributes);
            const displayName = getAttributeValue('displayName', attributes);
            const uid = getAttributeValue('uid', attributes);
            const mail = getAttributeValue('mail', attributes);

            let cn: string | undefined;
            if (cns) {
                // Take the last one, which is in OpenLDAP the actual group cn
                cn = [...cns].pop();
            } else if (dn) {
                // Fallback, cn should always be present
                cn = dn.split(',')[0].split('=').pop();
            }

            if (dn && cn && mail) {
                const ldapEntry: LdapEntryUser = {
                    dn,
                    cn,
                    sn,
                    uid,
                    mail,
                    givenName,
                    displayName,
                };
                if (extraAttributes) {
                    extraAttributes.forEach((extraAttr) => {
                        ldapEntry[extraAttr] = getAttributeValue(extraAttr, attributes);
                    });
                }

                entries.push(ldapEntry);
            } else {
                this._logger.warn('Incomplete LDAP entry, dn, cn, and mail is required. Present attributes: ', attributes);
            }
        });

        return entries;
    }

    async searchGroups(filter: string): Promise<Array<BaseLdapEntry>> {
        const searchClient = await this.getSearchClient();

        const searchOpts: SearchOptions = {
            filter,
            scope: 'sub',
        };

        let result;
        try {
            result = await searchClient.search(this._baseDN, searchOpts);
        } catch (e: any) {
            if (e.code === ERROR_NO_SUCH_OBJECT) {
                return [];
            }
            throw new Error(`LDAP group search failed: ${e.message}`);
        }

        const entries: Array<BaseLdapEntry> = [];
        result.searchEntries.forEach(({ dn, ...attributes }) => {
            const cns = getAttributeValues('cn', attributes);

            let cn: string | undefined;
            if (cns) {
                // Take the last one, which is in OpenLDAP the actual group cn
                cn = [...cns].pop();
            } else if (dn) {
                // Fallback, cn should always be present
                cn = dn.split(',')[0].split('=').pop();
            }

            if (dn && cn) {
                const ldapEntry: BaseLdapEntry = {
                    dn,
                    cn,
                };

                entries.push(ldapEntry);
            } else {
                this._logger.warn('Incomplete LDAP entry, dn and cs is required. Present attributes: ', attributes);
            }
        });

        return entries;
    }

    async login(ldapEntry: BaseLdapEntry, password: string): Promise<void> {
        let client;
        try {
            client = await this._createLdapTsClient();
            await client.bind(ldapEntry.dn, password);
            await client.unbind();
        } catch (error) {
            if (client) {
                try {
                    await client.unbind();
                } catch {
                    // Ignore
                }
            }
            this._logger.warn(`Binding with user ${ldapEntry.dn} failed`, error);
            throw error;
        }
    }

    shutdown(): void {
        if (this._searchClient) {
            try {
                this._searchClient.unbind();
            } catch {
                // Ignore
            }
            this._searchClient = null;
        }
    }

    private async getSearchClient(): Promise<LdapTsClient> {
        if (this._searchClient && this._searchClient.isConnected) {
            return this._searchClient;
        }

        try {
            const searchClient = await this._createLdapTsClient();
            const bind = async () => {
                try {
                    await searchClient.bind(this._bindDN, this._bindCredentials);
                } catch (error) {
                    this._logger.error(`Binding with user ${this._bindDN} failed`, error);
                    this._searchClient = null;
                }
            };
            await bind();
            this._searchClient = searchClient;
            return this._searchClient;
        } catch (error) {
            this._logger.error('Creating search LDAP client failed!', error);
            throw error;
        }
    }

    private async _createLdapTsClient(): Promise<LdapTsClient> {
        const clientOptions: ClientOptions = {
            url: `${this._serverUrl}/${this._baseDN}`,
            tlsOptions: this._tlsOptions as any,
            connectTimeout: this._connectTimeout,
            timeout: this._timeout,
        };

        return new LdapTsClient(clientOptions);
    }

}

