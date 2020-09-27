
import {createClient} from 'ldapjs';
import type {Client as LdapJsClient, SearchOptions} from 'ldapjs';

import type {TlsOptions} from 'tls';
import type {MashroomLogger, MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {LdapEntry, LdapClient} from '../type-definitions';

export default class LdapClientImpl implements LdapClient {

    private logger: MashroomLogger;

    constructor(private serverUrl: string, private baseDN: string, private bindDN: string, private bindCredentials: string,
                private tlsOptions: TlsOptions | undefined | null, loggerFactory: MashroomLoggerFactory) {
        this.logger = loggerFactory('mashroom.security.provider.ldap');
    }

    async search(filter: string): Promise<Array<LdapEntry>> {
        return await this.runWithClient(this.bindDN, this.bindCredentials, (ldapjsClient) => {
            const searchOpts: SearchOptions = {
                filter,
                scope: 'sub',
                attributes: ['dn', 'cn', 'uid', 'mail']
            };

            return new Promise((resolve, reject) => {
                const entries: Array<LdapEntry> = [];
                ldapjsClient.search(this.baseDN, searchOpts, (err, res) => {
                    res.on('searchEntry', entry => {
                        entries.push(entry.object as any);
                    });
                    res.on('error', error => {
                        this.logger.error('LDAP search error', {
                            error
                        });
                        reject(error);
                    });
                    res.on('end', () => {
                        resolve(entries);
                    });
                });
            });

        });
    }

    async login(ldapEntry: LdapEntry, password: string): Promise<void> {
        return await this.runWithClient(ldapEntry.dn, password, async () => {
            // Nothing to do
        });
    }

    private async runWithClient<T>(user: string, password: string, f: (ldapjsClient: LdapJsClient) => Promise<T>): Promise<T> {
        let client = null;
        try {
            client = createClient({
                url: `${this.serverUrl}/${this.baseDN}`,
                tlsOptions: this.tlsOptions as any,
            });
        } catch (error) {
            this.logger.error('Creating LDAP client failed!', {error});
            throw new Error('Could not establish LDAP connection');
        }

        try {
            await this.bind(user, password, client);
        } catch (error) {
            this.logger.error('Binding failed', {error});
            await this.unbind(client);
            throw new Error('Binding failed');
        }

        const result: T = await f(client);

        await this.unbind(client);

        return result;
    }

    private async bind(user: string, password: string, ldapjsClient: LdapJsClient): Promise<void> {
        return new Promise((resolve, reject) => {
            ldapjsClient.bind(user, password, (error) => {
                if (error) {
                    this.logger.error(`Binding with user ${user} failed`, {error});
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
                    this.logger.error('Unbinding failed', {error});
                    resolve();
                } else {
                    resolve();
                }
            });
        });
    }

}

