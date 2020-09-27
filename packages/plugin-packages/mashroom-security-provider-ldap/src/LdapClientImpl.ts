
import {createClient} from 'ldapjs';
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
            attributes: ['dn', 'cn', 'uid', 'mail']
        };

        return new Promise((resolve, reject) => {
            const entries: Array<LdapEntry> = [];
            searchClient.search(this.baseDN, searchOpts, (err, res) => {
                res.on('searchEntry', entry => {
                    entries.push(entry.object as any);
                });
                res.on('error', error => {
                    this.logger.error('LDAP search error', error);
                    reject(error);
                });
                res.on('end', () => {
                    resolve(entries);
                });
            });
        });
    }

    async login(ldapEntry: LdapEntry, password: string): Promise<void> {
        let client = null;
        try {
            client = createClient({
                url: `${this.serverUrl}/${this.baseDN}`,
                tlsOptions: this.tlsOptions as any,
                connectTimeout: this.connectTimeout,
                timeout: this.timeout,
            });
        } catch (error) {
            this.logger.error('Creating LDAP client failed!', error);
            throw new Error('Could not establish LDAP connection');
        }

        try {
            await this.bind(ldapEntry.dn, password, client);
        } catch (error) {
            await this.unbind(client);
            throw new Error('Login failed!');
        }
    }

    shutdown(): void {
        if (this.searchClient) {
            this.unbind(this.searchClient);
            this.searchClient = null;
        }
    }

    private async getSearchClient(): Promise<LdapJsClient> {
        if (this.searchClient) {
            return this.searchClient;
        }

        try {
            const searchClient = createClient({
                url: `${this.serverUrl}/${this.baseDN}`,
                tlsOptions: this.tlsOptions as any,
                connectTimeout: this.connectTimeout,
                timeout: this.timeout,
                reconnect: {
                    initialDelay: 100,
                    maxDelay: 1000,
                    failAfter: 10
                }
            });
            const bind = async () => {
                try {
                    await this.bind(this.bindDN, this.bindCredentials, searchClient);
                } catch (error) {
                    await this.unbind(searchClient);
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
            throw new Error('Could not establish LDAP connection');
        }
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

    private async unbind(ldapjsClient: LdapJsClient): Promise<void> {
        return new Promise((resolve) => {
            ldapjsClient.unbind((error) => {
                if (error) {
                    this.logger.warn('Unbinding failed', error);
                    resolve();
                } else {
                    resolve();
                }
            });
        });
    }

}

