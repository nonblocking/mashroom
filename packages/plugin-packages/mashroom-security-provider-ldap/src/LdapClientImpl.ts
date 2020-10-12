
import {ClientOptions, createClient} from 'ldapjs';
import type {Client as LdapJsClient, SearchOptions} from 'ldapjs';

import type {TlsOptions} from 'tls';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {LdapEntry, LdapClient} from '../type-definitions';

export default class LdapClientImpl implements LdapClient {

    private logger: MashroomLogger;
    private searchClient: LdapJsClient | null;

    constructor(private serverUrl: string, private connectTimeout: number, private timeout: number,
                private baseDN: string, private bindDN: string, private bindCredentials: string,
                private tlsOptions: TlsOptions | undefined | null, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.security.provider.ldap');
        this.searchClient = null;
    }

    async search(filter: string): Promise<Array<LdapEntry>> {
        const searchClient = await this.getSearchClient();

        const searchOpts: SearchOptions = {
            filter,
            scope: 'sub',
            attributes: ['dn', 'cn', 'sn', 'givenName', 'displayName', 'uid', 'mail']
        };

        return new Promise((resolve, reject) => {
            const entries: Array<LdapEntry> = [];
            searchClient.search(this.baseDN, searchOpts, (err, res) => {
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

                    entries.push({
                        dn: entry.dn,
                        cn: cn as string,
                        sn: entry.sn as string,
                        givenName: entry.givenName as string,
                        displayName: entry.displayName as string,
                        uid: entry.uid as string,
                        mail: entry.mail as string,
                    });
                });
                res.on('error', (error) => {
                    this.logger.error('LDAP search error', error);
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
            client = await this.createLdapJsClient();
            await this.bind(ldapEntry.dn, password, client);
            await this.disconnect(client);
        } catch (error) {
            if (client) {
                await this.disconnect(client);
            }
            throw new Error(error);
        }
    }

    shutdown(): void {
        if (this.searchClient) {
            this.disconnect(this.searchClient);
            this.searchClient = null;
        }
    }

    private async getSearchClient(): Promise<LdapJsClient> {
        if (this.searchClient) {
            return this.searchClient;
        }

        try {
            const searchClient = await this.createLdapJsClient(true);
            const bind = async () => {
                try {
                    await this.bind(this.bindDN, this.bindCredentials, searchClient);
                } catch (error) {
                    await this.disconnect(searchClient);
                    this.searchClient = null;
                }
            };
            await bind();
            searchClient.on('connect', async () => {
                // Re-bind on reconnect
                await bind();
            });
            this.searchClient = searchClient;
            return this.searchClient;
        } catch (error) {
            this.logger.error('Creating search LDAP client failed!', error);
            throw error;
        }
    }

    private async createLdapJsClient(reconnect = false): Promise<LdapJsClient> {
        const clientOptions: ClientOptions = {
            url: `${this.serverUrl}/${this.baseDN}`,
            tlsOptions: this.tlsOptions as any,
            connectTimeout: this.connectTimeout,
            timeout: this.timeout,
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
                    this.logger.debug(`Connected to LDAP server: ${this.serverUrl}`);
                    if (!resolved) {
                        resolve(client);
                        resolved = true;
                    }
                });
                client.on('connectError', (error) => {
                    this.logger.error('LDAP Connection error', error);
                    if (!resolved) {
                        reject(error);
                        resolved = true;
                    }
                });
                client.on('error', (error) => {
                    this.logger.error('LDAP Error', error);
                    if (!resolved) {
                        reject(error);
                        resolved = true;
                    }
                });
                client.on('destroy', () => {
                    this.logger.debug(`Disconnected from LDAP server: ${this.serverUrl}`);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    private async bind(user: string, password: string, ldapjsClient: LdapJsClient): Promise<void> {
        return new Promise((resolve, reject) => {
            ldapjsClient.bind(user, password, (error) => {
                if (error) {
                    this.logger.error(`Binding with user ${user} failed`, error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    private disconnect(ldapjsClient: LdapJsClient): void {
        if (ldapjsClient.connected) {
            ldapjsClient.destroy();
        }
    }

}

