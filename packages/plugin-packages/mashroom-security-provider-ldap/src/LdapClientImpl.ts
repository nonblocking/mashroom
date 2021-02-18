
import {ClientOptions, createClient} from 'ldapjs';
import type {Client as LdapJsClient, SearchOptions, Error as LdapError} from 'ldapjs';

import type {TlsOptions} from 'tls';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {LdapEntry, LdapClient} from '../type-definitions';

const DEFAULT_ATTRIBUTES = ['dn', 'cn', 'sn', 'givenName', 'displayName', 'uid', 'mail'];

export default class LdapClientImpl implements LdapClient {

    private _logger: MashroomLogger;
    private _searchClient: LdapJsClient | null;

    constructor(private _serverUrl: string, private _connectTimeout: number, private _timeout: number,
                private _baseDN: string, private _bindDN: string, private _bindCredentials: string,
                private _tlsOptions: TlsOptions | undefined | null, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.security.provider.ldap');
        this._searchClient = null;
    }

    async search(filter: string, extraAttributes?: Array<string>): Promise<Array<LdapEntry>> {
        const searchClient = await this.getSearchClient();

        const attributes = DEFAULT_ATTRIBUTES;
        if (extraAttributes) {
            extraAttributes.forEach((extraAttribute) => {
               if (!attributes.includes(extraAttribute)) {
                   attributes.push(extraAttribute);
               }
            });
        }

        const searchOpts: SearchOptions = {
            filter,
            scope: 'sub',
            attributes,
        };

        return new Promise((resolve, reject) => {
            const entries: Array<LdapEntry> = [];
            searchClient.search(this._baseDN, searchOpts, (err, res) => {
                if (err) {
                    reject(err);
                    return;
                }

                res.on('searchEntry', ({ object: entry }) => {
                    let cn: string | undefined;
                    if (Array.isArray(entry.cn)) {
                        // Take the last one, which is in OpenLDAP the actual group cn
                        cn = [...entry.cn].pop();
                    } else if (entry.cn) {
                        cn = entry.cn;
                    } else {
                        // Fallback, cn should always be present
                        cn = entry.dn.split(',')[0].split('=').pop();
                    }

                    const ldapEntry: LdapEntry = {
                        dn: entry.dn,
                        cn: cn as string,
                        sn: entry.sn as string,
                        givenName: entry.givenName as string,
                        displayName: entry.displayName as string,
                        uid: entry.uid as string,
                        mail: entry.mail as string,
                    };
                    if (extraAttributes) {
                        extraAttributes.forEach((extraAttr) => {
                            ldapEntry[extraAttr] = entry[extraAttr];
                        });
                    }

                    entries.push(ldapEntry);
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

    async login(ldapEntry: LdapEntry, password: string): Promise<void> {
        let client;
        try {
            client = await this._createLdapJsClient();
            await this._bind(ldapEntry.dn, password, client);
            await this._disconnect(client);
        } catch (error) {
            this._logger.warn(`Binding with user ${ldapEntry.dn} failed`, error);
            if (client) {
                await this._disconnect(client);
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
                    await this._disconnect(searchClient);
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

    private async _createLdapJsClient(reconnect = false): Promise<LdapJsClient> {
        const clientOptions: ClientOptions = {
            url: `${this._serverUrl}/${this._baseDN}`,
            tlsOptions: this._tlsOptions as any,
            connectTimeout: this._connectTimeout,
            timeout: this._timeout,
        };

        if (reconnect) {
            clientOptions.reconnect = {
                initialDelay: 100,
                maxDelay: 10000,
            };
        }

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
                    this._logger.error('LDAP Connection error', error);
                    if (!resolved) {
                        reject(error);
                        resolved = true;
                    }
                });
                client.on('error', (error: LdapError | null) => {
                    this._logger.error('LDAP Error', error);
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

