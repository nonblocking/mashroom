
import { createClient} from 'ldapjs';
import type {Client as LdapJsClient, SearchOptions, Error as LdapError,ClientOptions,Attribute} from 'ldapjs';

import type {TlsOptions} from 'tls';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {BaseLdapEntry, LdapEntryUser, LdapClient} from '../type-definitions';

const DEFAULT_ATTRIBUTES = ['dn', 'cn', 'sn', 'givenName', 'displayName', 'uid', 'mail'];

const getAttributeValue = (name: string, attributes: Array<Attribute>): string | undefined => {
    return attributes.find(({ type }) => type === name)?.values?.[0];
};

export default class LdapClientImpl implements LdapClient {

    private _logger: MashroomLogger;
    private _searchClient: LdapJsClient | null;

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

        // For some reason in LdapJS 3 the attribute names need now to be lower case
        attributes = attributes.map((a) => a.toLowerCase());

        const searchOpts: SearchOptions = {
            filter,
            scope: 'sub',
            attributes,
        };

        return new Promise((resolve, reject) => {
            const entries: Array<LdapEntryUser> = [];
            searchClient.search(this._baseDN, searchOpts, (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                res.on('searchEntry', ({ objectName, attributes }) => {
                    const dn = objectName?.toString();
                    const cns = attributes.find(({ type }) => type === 'cn')?.values;
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
                        this._logger.warn('Incomplete LDAP entry, dn, cn, and mail is required. Present attributes: ', attributes.map((a) => `${a.type}:${a.values}`));
                    }
                });
                res.on('error', (error) => {
                    this._logger.error('LDAP search error', error);
                    reject(error);
                });
                res.on('end', (result) => {
                    if (result?.status === 0) {
                        resolve(entries);
                    } else {
                        reject(new Error(`Search failed: ${result?.errorMessage}`));
                    }
                });
            });
        });
    }

    async searchGroups(filter: string): Promise<Array<BaseLdapEntry>> {
        const searchClient = await this.getSearchClient();

        const searchOpts: SearchOptions = {
            filter,
            scope: 'sub',
        };

        return new Promise((resolve, reject) => {
            const entries: Array<BaseLdapEntry> = [];
            searchClient.search(this._baseDN, searchOpts, (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                res.on('searchEntry', ({ objectName, attributes }) => {
                    const dn = objectName?.toString();
                    const cns = attributes.find(({ type }) => type === 'cn')?.values;

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
                        this._logger.warn('Incomplete LDAP entry, dn and cs is required. Present attributes: ', attributes.map((a) => `${a.type}:${a.values}`));
                    }
                });
                res.on('error', (error) => {
                    this._logger.error('LDAP search error', error);
                    reject(error);
                });
                res.on('end', (result) => {
                    if (result?.status === 0) {
                        resolve(entries);
                    } else {
                        reject(new Error(`Search failed: ${result?.errorMessage}`));
                    }
                });
            });
        });
    }

    async login(ldapEntry: BaseLdapEntry, password: string): Promise<void> {
        let client;
        try {
            client = await this._createLdapJsClient();
            await this._bind(ldapEntry.dn, password, client);
            this._disconnect(client);
        } catch (error) {
            this._logger.warn(`Binding with user ${ldapEntry.dn} failed`, error);
            if (client) {
                this._disconnect(client);
            }
            throw error;
        }
    }

    shutdown(): void {
        if (this._searchClient) {
            this._disconnect(this._searchClient);
            this._searchClient = null;
        }
    }

    private async getSearchClient(): Promise<LdapJsClient> {
        if (this._searchClient) {
            return this._searchClient;
        }

        try {
            const searchClient = await this._createLdapJsClient(true);
            const bind = async () => {
                try {
                    await this._bind(this._bindDN, this._bindCredentials, searchClient);
                } catch (error) {
                    this._logger.error(`Binding with user ${this._bindDN} failed`, error);
                    this._disconnect(searchClient);
                    this._searchClient = null;
                }
            };
            await bind();
            searchClient.on('connect', async () => {
                // Re-bind on reconnect
                await bind();
            });
            this._searchClient = searchClient;
            return this._searchClient;
        } catch (error) {
            this._logger.error('Creating search LDAP client failed!', error);
            throw error;
        }
    }

    private async _createLdapJsClient(keepForever = false): Promise<LdapJsClient> {
        const clientOptions: ClientOptions = {
            url: `${this._serverUrl}/${this._baseDN}`,
            tlsOptions: this._tlsOptions as any,
            connectTimeout: this._connectTimeout,
            timeout: this._timeout,
            reconnect: {
                initialDelay: 100,
                maxDelay: 10000,
                failAfter: keepForever ? Infinity : 3,
            }
        };

        return new Promise((resolve, reject) => {
            let resolved = false;
            let client: LdapJsClient;
            try {
                client = createClient(clientOptions);
                client.on('connect', () => {
                    this._logger.debug(`Connected to LDAP server: ${this._serverUrl}`);
                    if (!resolved) {
                        resolve(client);
                        resolved = true;
                    }
                });
                client.on('connectError', (error: LdapError | null) => {
                    this._logger.error('LDAP connection error', error);
                    if (!resolved) {
                        reject(error);
                        resolved = true;
                    }
                });
                client.on('error', (error: LdapError | null) => {
                    this._logger.warn('LDAP connection error, reconnecting...', error);
                    if (!resolved) {
                        reject(error);
                        resolved = true;
                    }
                });
                client.on('destroy', () => {
                    this._logger.debug(`Disconnected from LDAP server: ${this._serverUrl}`);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    private async _bind(user: string, password: string, ldapjsClient: LdapJsClient): Promise<void> {
        return new Promise((resolve, reject) => {
            ldapjsClient.bind(user, password, (error: LdapError | null) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    private _disconnect(ldapjsClient: LdapJsClient): void {
        if (ldapjsClient.connected) {
            ldapjsClient.destroy();
        }
    }

}

